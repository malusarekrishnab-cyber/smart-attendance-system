// Firebase SDK madhun function import kartoy
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";           // login sathi (pudhe lagla tar)
import { getFirestore } from "firebase/firestore"; // database sathi

// Config ata .env file madhun yete (security sathi safe)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase initialize kartoy
const app = initializeApp(firebaseConfig);

// entityClient.js ani baki files madhe vaparण्यासाठी export karतोय
export const auth = getAuth(app);
export const db = getFirestore(app);
