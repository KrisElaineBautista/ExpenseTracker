import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, getFirestore } from "firebase/firestore";
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBQWy922YoMWS2vhoBqbQMQfqoSSFZ7UkY",
  authDomain: "expense-tracker-3ee4b.firebaseapp.com",
  projectId: "expense-tracker-3ee4b",
  storageBucket: "expense-tracker-3ee4b.firebasestorage.app",
  messagingSenderId: "757410153188",
  appId: "1:757410153188:web:29ce45c311cf79441da2f1",
  measurementId: "G-47NVJ75ZGS"
};

// 1. Setup the App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Setup Firestore with Persistence (Database Offline Mode)
let dbInstance;
try {
  dbInstance = initializeFirestore(app, { localCache: persistentLocalCache() });
} catch (e) {
  dbInstance = getFirestore(app);
}
export const db = dbInstance;

// 3. Setup Auth with AsyncStorage (The Login Memory)
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  authInstance = getAuth(app);
}
export const auth = authInstance;