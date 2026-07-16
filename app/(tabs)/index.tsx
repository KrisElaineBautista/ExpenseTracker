import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, StyleSheet, KeyboardAvoidingView, Platform, RefreshControl, Image } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { subscribeToTransactions, addTransaction } from '../../services/firestore';
import { captureAndScanReceipt, pickAndScanReceipt } from '../../services/ocrService';
import { CATEGORIES } from '../../constants/Categories';
import { Plus, X, Banknote, Calendar as CalendarIcon, Target, Edit2, Camera, Image as ImageIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [choiceModalVisible, setChoiceModalVisible] = useState(false);
  const [scanning, setScanning] = useState(false);

  // New state parameters for viewing/saving base64 images
  const [activeBase64, setActiveBase64] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  const { colors, darkMode } = useTheme();

  const [userName, setUserName] = useState('User');
  const [monthlyBudget, setMonthlyBudget] = useState(10000);
  const [newBudgetInput, setNewBudgetInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [base64Image, setBase64Image] = useState<string | undefined>(undefined); // Dynamic temporary holding state

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserName(data.name?.split(' ')[0] || 'User');
        if (data.monthlyBudget) setMonthlyBudget(data.monthlyBudget);
      }
    };

    fetchUserData();
    const unsubscribe = subscribeToTransactions(user.uid, (data) => setTransactions(data));
    return () => unsubscribe();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSaveBudget = async () => {
    if (!newBudgetInput) return;
    const amountValue = parseFloat(newBudgetInput);
    try {
      await setDoc(doc(db, 'users', user!.uid), { monthlyBudget: amountValue }, { merge: true });
      setMonthlyBudget(amountValue);
      setBudgetModalVisible(false);
      setNewBudgetInput('');
    } catch (e) {
      Alert.alert("Error", "Could not save budget");
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const handleAdd = async (type: 'income' | 'expense') => {
    const finalCategory = category === 'Other' ? customCategory : category;
    if (!amount || !finalCategory) return Alert.alert("Error", "Please fill in all fields");

    const numAmount = parseFloat(amount);
    if (type === 'expense' && numAmount >= 5000) {
      Alert.alert("Budget Alert 💸", "This is a large expense!");
    }

    try {
      await addTransaction(user!.uid, {
        amount: numAmount,
        category: finalCategory,
        note,
        type,
        date: date,
        base64Image: base64Image // Saved directly to Firestore
      });
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert("Error", "Could not save to database.");
    }
  };

  const resetForm = () => {
    setAmount(''); setCategory(''); setCustomCategory(''); setNote('');
    setDate(new Date()); setBase64Image(undefined);
  };

  const applyOcrResult = (scanned: any) => {
    resetForm();
    if (scanned.amount) setAmount(scanned.amount.toString());
    if (scanned.category) setCategory(scanned.category);
    if (scanned.note) setNote(scanned.note);
    setDate(scanned.date);
    if (scanned.base64Image) setBase64Image(scanned.base64Image); // Passed into intermediate staging state

    if (!scanned.amount) {
      Alert.alert("Couldn't read the total", "We opened the form anyway — please fill in the amount.");
    }
    setModalVisible(true);
  };

  const handleScanReceipt = async () => {
    setChoiceModalVisible(false);
    setScanning(true);
    try {
      const scanned = await captureAndScanReceipt();
      setScanning(false);
      if (!scanned) return;

      applyOcrResult(scanned);
    } catch (e: any) {
      setScanning(false);
      console.log('SCAN ERROR:', e);
      Alert.alert('Scan failed', e?.message || 'Could not read that receipt. Try again.');
    }
  };

  const handleGalleryScan = async () => {
    setChoiceModalVisible(false);
    setScanning(true);
    try {
      const scanned = await pickAndScanReceipt();
      setScanning(false);
      if (!scanned) return;

      applyOcrResult(scanned);
    } catch (e: any) {
      setScanning(false);
      console.log('GALLERY SCAN ERROR:', e);
      Alert.alert('Scan failed', e?.message || 'Could not read that receipt. Try again.');
    }
  };

  const openManualEntry = () => {
    setChoiceModalVisible(false);
    resetForm();
    setModalVisible(true);
  };

  const openReceiptViewer = (b64: string) => {
    setActiveBase64(b64);
    setViewerVisible(true);
  };

  const currentMonthExpenses = transactions
    .filter(t => t.type === 'expense' && new Date(t.date?.toDate()).getMonth() === new Date().getMonth())
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalBalance = transactions.reduce((acc, curr) =>
    curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0);

  const budgetProgress = Math.min((currentMonthExpenses / monthlyBudget) * 100, 100);
  const isOverBudget = currentMonthExpenses > monthlyBudget;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>

      {/* GREETING SECTION */}
      <View style={styles.header}>
        <Text style={[styles.greetingText, { color: colors.text }]}>Hello, {userName} </Text>
        <Text style={[styles.subGreeting, { color: colors.subText }]}>Manage your finances today.</Text>
      </View>

      {/* BALANCE CARD */}
      <LinearGradient
        colors={darkMode ? ['#1e1b4b', '#312e81', '#4338ca'] : ['#4f46e5', '#6366f1', '#818cf8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.balanceCard,
          {
            shadowColor: colors.shadowColor,
            shadowOpacity: colors.shadowOpacity,
            shadowRadius: 15,
            shadowOffset: { width: 0, height: 6 }
          }
        ]}
      >
        <View style={styles.balanceTopRow}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Banknote color="white" size={22} />
        </View>
        <Text style={styles.balanceAmount}>₱{totalBalance.toLocaleString()}</Text>
      </LinearGradient>

      {/* BUDGET GOAL CARD */}
      <View style={[
        styles.goalCard,
        {
          backgroundColor: colors.card5,
          shadowColor: colors.shadowColor,
          shadowOpacity: colors.shadowOpacity,
          shadowRadius: 10,
          elevation: 5
        }
      ]}>
        <View style={styles.goalHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Target color="#ff0800" size={20} />
            <Text style={[styles.goalTitle, { color: colors.text }]}>Monthly Budget</Text>
          </View>
          <TouchableOpacity onPress={() => setBudgetModalVisible(true)}>
            <Edit2 color={colors.icon1} size={16} />
          </TouchableOpacity>
        </View>
        <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
          <View style={[styles.progressBar, { width: `${budgetProgress}%`, backgroundColor: isOverBudget ? '#ef4444' : '#38c477' }]} />
        </View>
        <View style={styles.goalFooter}>
          <Text style={[styles.goalText, { color: colors.subText }]}>Spent ₱{currentMonthExpenses.toLocaleString()} of ₱{monthlyBudget.toLocaleString()}</Text>
          <Text style={[styles.percentageText, { color: isOverBudget ? '#ef4444' : colors.text }]}>{budgetProgress.toFixed(0)}%</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
      >
        {transactions.map((item) => {
          const catInfo = CATEGORIES[item.category as keyof typeof CATEGORIES] || { icon: Banknote, color: colors.icon1 };
          const Icon = catInfo.icon;
          const displayDate = item.date?.toDate ? item.date.toDate().toLocaleDateString() : 'Today';

          return (
            <View key={item.id} style={[
              styles.transactionCard,
              {
                backgroundColor: colors.card4,
                shadowColor: colors.shadowColor,
                shadowOpacity: colors.shadowOpacity,
                shadowRadius: 5,
                elevation: 2
              }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {item.base64Image ? (
                  // Clicking on the receipt thumbnail opens it up full-screen
                  <TouchableOpacity onPress={() => openReceiptViewer(item.base64Image)}>
                    <Image source={{ uri: item.base64Image }} style={styles.thumbnail} />
                  </TouchableOpacity>
                ) : (
                  <View style={{ backgroundColor: catInfo.color + '15', padding: 10, borderRadius: 12 }}>
                    <Icon color={catInfo.color} size={20} />
                  </View>
                )}
                
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{item.category}</Text>
                  <Text style={{ color: colors.subText, fontSize: 12 }} numberOfLines={1}>{displayDate} • {item.note || 'No note'}</Text>
                </View>
              </View>
              <Text style={{ fontWeight: 'bold', color: item.type === 'income' ? '#22c55e' : '#ef4444' }}>
                {item.type === 'income' ? '+' : '-'}₱{item.amount.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setChoiceModalVisible(true)}
        style={[styles.fab, { backgroundColor: colors.text }]}
        disabled={scanning}
      >
        <Plus color={colors.bg} size={32} />
      </TouchableOpacity>

      {/* CHOICE BOTTOM SHEET MODAL */}
      <Modal visible={choiceModalVisible} animationType="slide" transparent={true}>
        <TouchableOpacity 
          style={styles.sheetOverlay} 
          activeOpacity={1} 
          onPress={() => setChoiceModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.sheetContent, { backgroundColor: colors.modal1 }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.text2 }]}>Add Entry</Text>
            <Text style={[styles.sheetSubtitle, { color: colors.subtext1 }]}>How would you like to add this?</Text>

            <TouchableOpacity onPress={handleScanReceipt} style={[styles.optionRow, { backgroundColor: colors.border1 }]}>
              <View style={[styles.optionIconWrap, { backgroundColor: '#4f46e520' }]}>
                <Camera color="#4f46e5" size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.text2 }]}>Scan with Camera</Text>
                <Text style={[styles.optionSubtitle, { color: colors.subtext1 }]}>Auto-fill by taking a photo</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleGalleryScan} style={[styles.optionRow, { backgroundColor: colors.border1 }]}>
              <View style={[styles.optionIconWrap, { backgroundColor: '#0ea5e920' }]}>
                <ImageIcon color="#0ea5e9" size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.text2 }]}>Upload from Gallery</Text>
                <Text style={[styles.optionSubtitle, { color: colors.subtext1 }]}>Auto-fill from an existing image</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={openManualEntry} style={[styles.optionRow, { backgroundColor: colors.border1 }]}>
              <View style={[styles.optionIconWrap, { backgroundColor: '#64748b20' }]}>
                <Edit2 color="#64748b" size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: colors.text2 }]}>Enter Manually</Text>
                <Text style={[styles.optionSubtitle, { color: colors.subtext1 }]}>Type in the details yourself</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setChoiceModalVisible(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: colors.subtext1 }]}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* SCANNING OVERLAY */}
      {scanning && (
        <View style={styles.scanningOverlay}>
          <View style={[styles.smallModalContent, { backgroundColor: colors.modal1, alignItems: 'center' }]}>
            <Camera color={colors.text} size={28} />
            <Text style={{ color: colors.text, marginTop: 10, fontWeight: '600' }}>Reading receipt…</Text>
          </View>
        </View>
      )}

      {/* SET BUDGET MODAL */}
      <Modal visible={budgetModalVisible} animationType="fade" transparent={true}>
        <View style={styles.centerModal}>
          <View style={[styles.smallModalContent, { backgroundColor: colors.modal1 }]}>
            <Text style={[styles.modalTitle, { color: colors.text2 }]}>Set Monthly Budget</Text>
            <TextInput
              placeholder="e.g. 10000"
              placeholderTextColor={colors.subtext1}
              keyboardType="numeric"
              value={newBudgetInput}
              onChangeText={setNewBudgetInput}
              style={[styles.input, { backgroundColor: colors.border1, color: colors.subtext1 }]}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => setBudgetModalVisible(false)} style={[styles.btn, { backgroundColor: colors.border2 }]}><Text style={{color: 'white'}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSaveBudget} style={[styles.btn, { backgroundColor: '#11962d' }]}><Text style={{color: 'white', fontWeight: 'bold'}}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD TRANSACTION MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modal1 }]}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text2 }}>Add Entry</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}><X color={colors.text} /></TouchableOpacity>
            </View>

            {/* If there's a receipt parsed, show a small preview inside the form */}
            {base64Image && (
              <View style={styles.formPreviewContainer}>
                <Image source={{ uri: base64Image }} style={styles.formReceiptPreview} />
                <TouchableOpacity style={styles.removeImageBadge} onPress={() => setBase64Image(undefined)}>
                  <X color="white" size={12} />
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              placeholder="Amount"
              placeholderTextColor={colors.subtext1}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              style={[styles.input, { backgroundColor: colors.border1, color: colors.text3 }]}
            />

            <TouchableOpacity style={[styles.datePickerBtn, { backgroundColor: colors.border1 }]} onPress={() => setShowDatePicker(true)}>
                <CalendarIcon color={colors.subtext1} size={20} />
                <Text style={[styles.datePickerText, { color: colors.subtext1 }]}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            )}

            <Text style={[styles.label, { color: colors.subText }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
              {Object.keys(CATEGORIES).map((cat) => (
                <TouchableOpacity key={cat} onPress={() => setCategory(cat)} style={[styles.chip, { backgroundColor: colors.border1 }, category === cat && styles.chipActive]}>
                  <Text style={[styles.chipText, { color: colors.subtext1 }, category === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setCategory('Other')} style={[styles.chip, { backgroundColor: colors.border1 }, category === 'Other' && styles.chipActive]}>
                <Text style={[styles.chipText, { color: colors.subtext1 }, category === 'Other' && styles.chipTextActive]}>Other</Text>
              </TouchableOpacity>
            </ScrollView>

            {category === 'Other' && <TextInput placeholder="Enter Category Name" placeholderTextColor={colors.subtext1} value={customCategory} onChangeText={setCustomCategory} style={[styles.input, { backgroundColor: colors.border1, color: colors.subtext1 }]} />}
            <TextInput placeholder="Note (Optional)" placeholderTextColor={colors.subtext1} value={note} onChangeText={setNote} style={[styles.input, { backgroundColor: colors.border1, color: colors.subtext1 }]} />

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => handleAdd('income')} style={[styles.btn, { backgroundColor: '#22c55e' }]}><Text style={styles.btnText}>Income</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => handleAdd('expense')} style={[styles.btn, { backgroundColor: '#ef4444' }]}><Text style={styles.btnText}>Expense</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FULL-SCREEN INTERACTIVE RECEIPT VIEWER MODAL */}
      <Modal visible={viewerVisible} animationType="fade" transparent={true}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerCloseBtn} onPress={() => setViewerVisible(false)}>
            <X color="white" size={28} />
          </TouchableOpacity>
          {activeBase64 && (
            <Image 
              source={{ uri: activeBase64 }} 
              style={styles.fullReceiptImage} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 60, marginBottom: 20 },
  greetingText: { fontSize: 24, fontWeight: 'bold' },
  subGreeting: { fontSize: 14 },
  balanceCard: {
    padding: 25,
    borderRadius: 24,
    marginBottom: 20,
    elevation: 8,
  },
  balanceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount: { color: 'white', fontSize: 36, fontWeight: 'bold' },
  goalCard: { padding: 20, borderRadius: 24, marginBottom: 25 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  goalTitle: { fontSize: 16, fontWeight: '700', marginLeft: 8 },
  progressContainer: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 5 },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  goalText: { fontSize: 13 },
  percentageText: { fontSize: 13, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  transactionCard: { padding: 15, borderRadius: 20, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  centerModal: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  smallModalContent: { width: '85%', padding: 25, borderRadius: 25 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  input: { padding: 16, borderRadius: 15, marginBottom: 12 },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 15, marginBottom: 12 },
  datePickerText: { marginLeft: 10, fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  chipText: { fontWeight: '600' },
  chipTextActive: { color: 'white' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  scanningOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  sheetContent: {
    padding: 24,
    paddingBottom: 34,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94a3b8',
    alignSelf: 'center',
    marginBottom: 16
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  sheetSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  optionSubtitle: {
    fontSize: 12.5,
    marginTop: 2
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600'
  },
  // NEW STYLING RULES FOR BASE64 MEDIA ELEMENT
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  formPreviewContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 16,
  },
  formReceiptPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  removeImageBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 25,
    zIndex: 10,
    padding: 10,
  },
  fullReceiptImage: {
    width: '90%',
    height: '75%',
  }
});