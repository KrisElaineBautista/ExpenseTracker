import { db } from '../firebaseConfig'; 
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy, 
  Timestamp, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';

export interface TransactionData {
  amount: number;
  category: string;
  note: string;
  type: 'income' | 'expense';
  date: Date;
  base64Image?: string; // Optional field for compressed receipt images
}

// 1. UPDATED: Accepts the base64Image property inside the data payload
export const addTransaction = async (userId: string, data: TransactionData) => {
  return await addDoc(collection(db, 'users', userId, 'transactions'), {
    ...data,
    // Convert the JavaScript Date object to a Firestore Timestamp
    date: Timestamp.fromDate(data.date), 
  });
};

// 2. Real-time listener
export const subscribeToTransactions = (userId: string, callback: (data: any[]) => void) => {
  const q = query(
    collection(db, 'users', userId, 'transactions'),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(transactions);
  });
};

// Alias export used in your dashboard import paths
export const getTransactions = subscribeToTransactions;

// 3. Delete a transaction
export const deleteTransaction = async (userId: string, transactionId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'transactions', transactionId));
  } catch (error) {
    console.error("Delete Error:", error);
    throw error;
  }
};