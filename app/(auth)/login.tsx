import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import { Mail, Lock, LogIn, ChevronRight } from 'lucide-react-native'; // Professional Icons

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill in all fields");
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // RootLayout handles the redirect to (tabs) automatically
    } catch (error: any) {
      Alert.alert("Login Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <LogIn color="white" size={32} />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue tracking your expenses</Text>
        </View>

        {/* INPUT SECTION */}
        <View style={styles.inputGroup}>
          <View style={styles.inputWrapper}>
            <Mail color="#94a3b8" size={20} style={styles.icon} />
            <TextInput 
              placeholder="Email Address" 
              placeholderTextColor="#94a3b8"
              value={email} 
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input} 
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock color="#94a3b8" size={20} style={styles.icon} />
            <TextInput 
              placeholder="Password" 
              placeholderTextColor="#94a3b8"
              value={password} 
              onChangeText={setPassword}
              secureTextEntry 
              style={styles.input} 
            />
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* LOGIN BUTTON */}
        <TouchableOpacity 
          onPress={handleLogin}
          disabled={loading}
          style={[styles.loginBtn, loading && { opacity: 0.8 }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.loginBtnText}>Sign In</Text>
              <ChevronRight color="white" size={20} />
            </>
          )}
        </TouchableOpacity>

        {/* FOOTER */}
        <TouchableOpacity 
          onPress={() => router.push('/(auth)/signup')} 
          style={styles.footer}
        >
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  innerContainer: { flex: 1, justifyContent: 'center', padding: 30 },
  
  // Header Styles
  header: { alignItems: 'center', marginBottom: 50 },
  logoCircle: { 
    width: 70, 
    height: 70, 
    borderRadius: 24, 
    backgroundColor: '#4f46e5', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#4f46e5',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  title: { fontSize: 32, fontWeight: '900', color: '#1e293b', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', paddingHorizontal: 20 },

  // Input Styles
  inputGroup: { marginBottom: 30 },
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
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1e293b' },
  
  forgotBtn: { alignSelf: 'flex-end', marginTop: 5 },
  forgotText: { color: '#4f46e5', fontWeight: '600', fontSize: 14 },

  // Button Styles
  loginBtn: { 
    backgroundColor: '#1e293b', // Dark button for high contrast
    height: 60, 
    borderRadius: 18, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 8 },

  // Footer Styles
  footer: { marginTop: 30 },
  footerText: { textAlign: 'center', color: '#64748b', fontSize: 15 },
  signUpLink: { color: '#4f46e5', fontWeight: 'bold' }
});