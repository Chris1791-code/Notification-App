import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// TODO: cấu hình persistence bằng AsyncStorage (initializeAuth + getReactNativePersistence
// theo hướng dẫn RN của Firebase) trước khi lên production, để phiên đăng nhập không mất
// khi tắt app. getAuth() mặc định chỉ giữ phiên trong bộ nhớ của lần chạy hiện tại.
export const auth = getAuth(firebaseApp);

export const db = getFirestore(firebaseApp);
