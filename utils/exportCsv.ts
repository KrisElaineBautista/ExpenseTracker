import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export const exportToCSV = async (transactions: any[]) => {
  if (!transactions || transactions.length === 0) {
    Alert.alert("No Data", "There are no transactions to export yet.");
    return;
  }

  // 1. Create CSV Header
  const header = "Date,Category,Type,Amount,Note\n";
  
  // 2. Format Rows
  const rows = transactions.map(t => {
    // Handle Firestore Timestamp conversion
    const dateStr = t.date?.toDate 
      ? t.date.toDate().toLocaleDateString() 
      : new Date().toLocaleDateString();
      
    return `${dateStr},${t.category},${t.type},${t.amount},"${t.note || ''}"`;
  }).join("\n");

  const csvContent = header + rows;
  const fileUri = FileSystem.documentDirectory + "My_Expense_Report.csv";

  try {
    // 3. Write file using string encoding directly (Fixes the UTF8 error)
    await FileSystem.writeAsStringAsync(fileUri, csvContent, { 
        encoding: 'utf8' 
    });
    
    // 4. Check if sharing is available and open menu
    const isSharingAvailable = await Sharing.isAvailableAsync();
    
    if (isSharingAvailable) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert("Error", "Sharing is not available on this device.");
    }
  } catch (error) {
    console.error("Export Error:", error);
    Alert.alert("Export Failed", "Could not generate the CSV file.");
  }
};