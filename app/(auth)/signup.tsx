import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig'; 
import { useRouter } from 'expo-router';
import { User, Mail, Lock, UserPlus, ChevronLeft } from 'lucide-react-native'; // Professional Icons

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: name,
        email: email,
        currency: 'PHP',
        monthlyBudget: 10000, // Default budget
        createdAt: new Date()
      });

    } catch (error: any) {
      Alert.alert("Signup Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* BACK BUTTON */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#1e293b" size={28} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <UserPlus color="white" size={30} />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us and start managing your budget smarter today.</Text>
        </View>

        <View style={styles.form}>
          {/* NAME INPUT */}
          <View style={styles.inputWrapper}>
            <User color="#94a3b8" size={20} style={styles.icon} />
            <TextInput 
              placeholder="Full Name" 
              value={name} 
              onChangeText={setName} 
              placeholderTextColor="#94a3b8"
              style={styles.input} 
            />
          </View>

          {/* EMAIL INPUT */}
          <View style={styles.inputWrapper}>
            <Mail color="#94a3b8" size={20} style={styles.icon} />
            <TextInput 
              placeholder="Email Address" 
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#94a3b8"
              style={styles.input} 
            />
          </View>

          {/* PASSWORD INPUT */}
          <View style={styles.inputWrapper}>
            <Lock color="#94a3b8" size={20} style={styles.icon} />
            <TextInput 
              placeholder="Password" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
              placeholderTextColor="#94a3b8"
              style={styles.input} 
            />
          </View>

          {/* SIGNUP BUTTON */}
          <TouchableOpacity 
            onPress={handleSignup} 
            style={[styles.button, loading && { opacity: 0.8 }]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Register Now</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.loginLink}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContainer: { flexGrow: 1, padding: 30, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  
  header: { alignItems: 'center', marginBottom: 40 },
  iconContainer: { 
    width: 64, 
    height: 64, 
    borderRadius: 20, 
    backgroundColor: '#4f46e5', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
  },
  title: { fontSize: 30, fontWeight: '900', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  form: { width: '100%' },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    borderRadius: 16, 
    marginBottom: 15, 
    paddingHorizontal: 15,
    height: 60,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1e293b' },

  button: { 
    backgroundColor: '#1e293b', 
    height: 60, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 10,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

  footer: { marginTop: 30 },
  footerText: { textAlign: 'center', color: '#64748b', fontSize: 15 },
  loginLink: { color: '#4f46e5', fontWeight: 'bold' }
});