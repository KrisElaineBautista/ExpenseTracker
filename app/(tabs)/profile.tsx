import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, Platform } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { User, LogOut, Moon, ShieldCheck, ChevronRight, Mail } from 'lucide-react-native';
// 1. Import the hook from your context
import { useTheme } from '../../context/ThemeContext'; 

export default function ProfileScreen() {
  const user = auth.currentUser;
  const [fullName, setFullName] = useState('User');

  // 2. Pull the global state and toggle function
  const { darkMode, toggleTheme, colors } = useTheme();

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFullName(docSnap.data().name || 'User');
      }
    };
    fetchProfile();
  }, [user]);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => signOut(auth) }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Account Settings</Text>
      </View>

      {/* User Info Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.card4 }]}>
        <View style={styles.avatar}>
          <User color="white" size={40} />
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>{fullName}</Text>
        <View style={styles.emailRow}>
          <Mail color={colors.subText} size={14} />
          <Text style={[styles.userEmail, { color: colors.subText }]}> {user?.email}</Text>
        </View>
      </View>

      {/* Settings Section */}
      <View style={[styles.section, { backgroundColor: colors.card4 }]}>
        <View style={[styles.option, { borderBottomColor: colors.border }]}>
          <View style={styles.optionLeft}>
            <Moon color={darkMode ? "#fbbf24" : "#1e293b"} size={22} />
            <Text style={[styles.optionText, { color: colors.text }]}>Dark Mode</Text>
          </View>
          <Switch 
            value={darkMode} 
            onValueChange={toggleTheme} // 3. Use toggleTheme instead of setDarkMode
            trackColor={{ true: '#00adb9', false: '#cbd5e1' }} 
            thumbColor={Platform.OS === 'ios' ? undefined : darkMode ? '#ffffff' : '#f4f3f4'}
          />
        </View>

      

        <TouchableOpacity style={[styles.option, { borderBottomWidth: 0 }]} onPress={handleLogout}>
          <View style={styles.optionLeft}>
            <LogOut color="#ef4444" size={22} />
            <Text style={[styles.optionText, { color: '#ef4444' }]}>Sign Out</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.footerText, { color: colors.subText }]}>
        v1.0.0 • {darkMode ? 'Dark Mode' : 'Light Mode'} Enabled
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 65, marginBottom: 25 },
  title: { fontSize: 24, fontWeight: 'bold' },
  profileCard: { 
    padding: 25, 
    borderRadius: 24, 
    alignItems: 'center', 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    marginBottom: 25 
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#38795e', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  userName: { fontSize: 20, fontWeight: 'bold' },
  emailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  userEmail: { fontSize: 14 },
  section: { 
    borderRadius: 24, 
    paddingHorizontal: 10, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 5 
  },
  option: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 18, 
    borderBottomWidth: 1 
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionText: { marginLeft: 15, fontSize: 16, fontWeight: '500' },
  footerText: { textAlign: 'center', marginTop: 30, fontSize: 12 }
});