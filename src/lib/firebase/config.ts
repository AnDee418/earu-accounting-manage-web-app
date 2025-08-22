import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAppCheck, initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebaseアプリの初期化
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app);

// Storage
export const storage = getStorage(app);

// App Check初期化（ブラウザ環境のみ）
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_APP_CHECK_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_APP_CHECK_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

export { app };