import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 開発環境での設定確認
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Config Check:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    projectId: firebaseConfig.projectId,
  });
}

// Firebaseアプリの初期化
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth
export const auth = getAuth(app);

// 開発環境でのApp Check無効化
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // @ts-ignore - Firebase internal property for development
  if ((globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN) {
    (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
}

// Firestore
export const db = getFirestore(app);

// Storage
export const storage = getStorage(app);

// App Check初期化（本番環境のみ）
if (typeof window !== 'undefined' && 
    process.env.NODE_ENV === 'production' && 
    process.env.NEXT_PUBLIC_APP_CHECK_KEY) {
  // 本番環境でのみApp Checkを動的にインポート
  import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_APP_CHECK_KEY!),
        isTokenAutoRefreshEnabled: true,
      });
      console.log('App Check initialized for production');
    } catch (error) {
      console.warn('App Check initialization failed:', error);
    }
  }).catch(error => {
    console.warn('App Check import failed:', error);
  });
} else if (process.env.NODE_ENV === 'development') {
  // 開発環境では App Check を完全無効化
  console.log('App Check disabled in development mode');
}

export { app };