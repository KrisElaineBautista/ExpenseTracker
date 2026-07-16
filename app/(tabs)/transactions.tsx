import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { auth } from '../../firebaseConfig';
import { getTransactions, deleteTransaction } from '../../services/firestore';
import { ArrowUpCircle, ArrowDownCircle, Trash2, History, Search, X } from 'lucide-react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useTheme } from '../../context/ThemeContext'; 

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const user = auth.currentUser;

  const { colors, darkMode } = useTheme();

  useEffect(() => {
    if (!user) return;
    const unsubscribe = getTransactions(user.uid, setTransactions);
    return () => unsubscribe();
  }, [user]);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Transaction", "Are you sure you want to remove this record?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => await deleteTransaction(user!.uid, id) 
      }
    ]);
  };

  const filteredList = transactions.filter(item => {
    const categoryMatch = item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const noteMatch = item.note ? item.note.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    return categoryMatch || noteMatch;
  });

  const renderRightActions = (prog: any, drag: any, id: string) => {
    return (
      <TouchableOpacity onPress={() => handleDelete(id)} style={styles.deleteAction}>
        <Trash2 color="white" size={24} />
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const dateObj = item.date?.toDate ? item.date.toDate() : new Date();
    const formattedDate = dateObj.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <ReanimatedSwipeable
        containerStyle={[styles.swipeContainer, { backgroundColor: 'transparent' }]}
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={40}
        renderRightActions={(prog, drag) => renderRightActions(prog, drag, item.id)}
      >
        {/* TRANSACTION CARD - Added Border Logic */}
        <View style={[
          styles.card, 
          { 
            backgroundColor: colors.card4,
            shadowColor: colors.shadowColor,
            shadowOpacity: colors.shadowOpacity,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 5,
            // Border added for Dark Mode visibility
            borderWidth: darkMode ? 1 : 0,
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
          }
        ]}>
          <View style={styles.leftSection}>
            {item.type === 'income' ? (
              <ArrowUpCircle color="#22c55e" size={28} />
            ) : (
              <ArrowDownCircle color="#ef4444" size={28} />
            )}
            <View style={styles.info}>
              <Text style={[styles.category, { color: colors.text }]}>{item.category}</Text>
              <View style={styles.detailsRow}>
                <Text style={[styles.dateText, { color: colors.subText }]}>{formattedDate}</Text>
                <Text style={[styles.dotSeparator, { color: colors.border }]}> • </Text>
                <Text style={[styles.note, { color: colors.subText }]} numberOfLines={1}>{item.note || 'No note'}</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.amount, { color: item.type === 'income' ? '#22c55e' : '#ef4444' }]}>
            {item.type === 'income' ? '+' : '-'}₱{item.amount.toLocaleString()}
          </Text>
        </View>
      </ReanimatedSwipeable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <History color="#ff7300" size={28} />
        <Text style={[styles.title, { color: colors.text }]}>History</Text>
      </View>

      {/* SEARCH BAR - Added Border Logic */}
      <View style={[
        styles.searchContainer, 
        { 
          backgroundColor: colors.card2,
          shadowColor: colors.shadowColor,
          shadowOpacity: colors.shadowOpacity / 2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
          borderWidth: darkMode ? 1 : 0,
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
        }
      ]}>
        <Search color={colors.subText} size={20} />
        <TextInput 
          placeholder="Search by category or note..." 
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: colors.text }]}
          placeholderTextColor={colors.subText}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X color={colors.subText} size={20} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.subText }]}>
              {searchQuery.length > 0 ? "No matches found." : "No history yet."}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 65,
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },

  // SEARCH BAR
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 16,
    height: 52,
    marginBottom: 20,

    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },

  swipeContainer: {
    marginBottom: 14,
    borderRadius: 18,
  },

  // TRANSACTION CARD
  card: {
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 18,

    // premium shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },

  deleteAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 16,
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  info: {
    marginLeft: 12,
    flex: 1,
  },

  category: {
    fontSize: 16,
    fontWeight: '600',
  },

  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },

  dotSeparator: {
    fontSize: 12,
  },

  note: {
    fontSize: 12,
    flex: 1,
  },

  amount: {
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 16,
  },
});