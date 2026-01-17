import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration - Lee desde variables de entorno con fallback
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDwyugm1pAbuKZQDw68FiQWM-nxyS7rYaQ",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "renta-facil-d04c7.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "renta-facil-d04c7",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "renta-facil-d04c7.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "620921777821",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:620921777821:web:27519ff4a0cc5c96e96e74",
};

console.log('🔥 Initializing Firebase with:', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 20)}...` : 'undefined',
  fromEnv: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
});

// Initialize Firebase only once
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} else {
  app = getApps()[0];
  console.log('✅ Firebase already initialized');
}

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;
