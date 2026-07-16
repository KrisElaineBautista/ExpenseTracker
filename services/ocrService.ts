import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system'; // NEW IMPORT
import { CATEGORIES } from '../constants/Categories';

const OCR_SPACE_API_KEY = 'K86499659688957';

export interface ScannedReceipt {
  amount: number | null;
  category: string;
  note: string;
  date: Date;
  rawText: string;
  base64Image?: string; // NEW PROPERTY
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ['jollibee', 'mcdo', 'mcdonald', 'kfc', 'chowking', 'restaurant', 'cafe', 'coffee', 'starbucks', 'food', 'bakery', 'canteen', 'rbx', 'rice in a box'],
  Groceries: ['sm supermarket', 'puregold', 'robinsons', 'grocery', 'mart', 'supermarket', 'savemore', 'convenience', '7-eleven', '7eleven'],
  Health: ['mercury drug', 'watsons', 'pharmacy', 'clinic', 'hospital', 'drugstore', 'med', 'medical'],
  Transportation: ['grab', 'gas', 'petron', 'shell', 'fuel', 'toll', 'caltex', 'cleanfuel'],
  Shopping: ['shopee', 'lazada', 'mall', 'store', 'h&m', 'uniqlo', 'sm store', 'department'],
  Bills: ['meralco', 'globe', 'pldt', 'water', 'electric', 'bill', 'telecom'],
};

function guessCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      return CATEGORIES[category] ? category : 'Others'; 
    }
  }
  return 'Others';
}

function extractTotal(text: string): number | null {
  const cleanText = text.replace(/,/g, '');
  const totalKeywords = /(?:take-out total|dine-in total|grand total|total due|net sales|amount due|total|totai|gtotal)/i;
  const globalTotalRegex = new RegExp(`${totalKeywords.source}[^\\d]{0,40}(?:PHP|P|₱)?\\s*(\\d+\\.\\d{2})`, 'i');
  
  const totalMatch = cleanText.match(globalTotalRegex);
  if (totalMatch) {
    const parsed = parseFloat(totalMatch[1]);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  const allPrices = [...cleanText.matchAll(/(?:^|\s)(\d+\.\d{2})(?:\s|$)/g)]
    .map(m => parseFloat(m[1]))
    .filter(n => !isNaN(n) && n > 0 && n < 100000);

  if (allPrices.length >= 3) {
    const sortedPrices = [...new Set(allPrices)].sort((a, b) => b - a);
    for (let i = 0; i < sortedPrices.length; i++) {
      const cash = sortedPrices[i];
      if (cash % 50 === 0 || cash % 100 === 0) { 
        for (let j = i + 1; j < sortedPrices.length; j++) {
          const second = sortedPrices[j];
          for (let k = j + 1; k < sortedPrices.length; k++) {
            const third = sortedPrices[k];
            if (Math.abs(cash - second - third) < 0.05) {
              const secondRegex = new RegExp(`change[^\\d]{0,30}${second}`, 'i');
              if (secondRegex.test(cleanText)) return third;
              return second;
            }
          }
        }
      }
    }
  }

  const sensiblePrices = allPrices.filter(price => price !== 1000 && price !== 500 && price !== 200 && price !== 100);
  return sensiblePrices.length ? Math.max(...sensiblePrices) : (allPrices.length ? Math.max(...allPrices) : null);
}

function extractDate(text: string): Date {
  const numericPattern = /(\d{1,2})[\/\-._\s](\d{1,2})[\/\-._\s](\d{2,4})/;
  const numericMatch = text.match(numericPattern);
  if (numericMatch) {
    const normalized = numericMatch[0].replace(/[\-._\s]/g, '/');
    const parsed = new Date(normalized);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const months = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';
  const textPattern = new RegExp(`(\\d{1,2})?\\s*(${months})\\w*\\s*(\\d{1,2})?,?\\s*(\\d{2,4})`, 'i');
  const textMatch = text.match(textPattern);
  if (textMatch) {
    const parsed = new Date(textMatch[0]);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return new Date();
}

function extractStoreName(lines: string[]): string {
  const skip = /^\d+$/;
  const noise = /receipt|invoice|welcome|tax|tin:|permit|terminal|cashier/i;

  for (const line of lines.slice(0, 5)) {
    if (line.length > 3 && !skip.test(line) && !noise.test(line)) {
      return line;
    }
  }
  return 'Unknown Merchant';
}

function parse(rawText: string): Omit<ScannedReceipt, 'rawText' | 'base64Image'> {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  return {
    amount: extractTotal(rawText),
    category: guessCategory(rawText),
    note: extractStoreName(lines),
    date: extractDate(rawText),
  };
}

async function recognizeTextFromUri(uri: string): Promise<string> {
  let cleanUri = uri;
  if (Platform.OS === 'android' && !cleanUri.startsWith('file://')) {
    cleanUri = `file://${cleanUri}`;
  }

  const formData = new FormData();
  formData.append('apikey', OCR_SPACE_API_KEY);
  formData.append('language', 'eng');
  formData.append('OCREngine', '2');
  formData.append('scale', 'true');
  formData.append('file', {
    uri: cleanUri,
    type: 'image/jpeg',
    name: 'receipt.jpg',
  } as any);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.ocr.space/parse/image');

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.IsErroredOnProcessing) {
            const msg = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(', ') : data.ErrorMessage;
            reject(new Error(msg || 'OCR failed to process the image'));
          } else {
            resolve(data.ParsedResults?.[0]?.ParsedText || '');
          }
        } catch (e) {
          reject(new Error('Failed to interpret OCR response. Please try again.'));
        }
      } else {
        reject(new Error(`OCR server error (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Local network request failed — check your settings.'));
    xhr.ontimeout = () => reject(new Error('The request timed out. Please try again.'));
    xhr.timeout = 30000;
    xhr.send(formData);
  });
}

// Convert local URI into JPEG Base64 string
async function convertUriToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("Error converting to Base64", error);
    return '';
  }
}

async function ensureCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function captureAndScanReceipt(): Promise<ScannedReceipt | null> {
  const hasPermission = await ensureCameraPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: 'images',
    allowsEditing: true, // Let them crop to reduce physical file size!
    quality: 0.4,       // Lower quality limits Base64 string length for Firestore
  });

  if (result.canceled || !result.assets?.[0]?.uri) return null;

  const localUri = result.assets[0].uri;
  const rawText = await recognizeTextFromUri(localUri);
  const base64Image = await convertUriToBase64(localUri);

  return { ...parse(rawText), rawText, base64Image };
}

export async function pickAndScanReceipt(): Promise<ScannedReceipt | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true, 
    quality: 0.4,       // Keeps document size well below the 1MB Firestore limit
  });

  if (result.canceled || !result.assets?.[0]?.uri) return null;

  const localUri = result.assets[0].uri;
  const rawText = await recognizeTextFromUri(localUri);
  const base64Image = await convertUriToBase64(localUri);

  return { ...parse(rawText), rawText, base64Image };
}