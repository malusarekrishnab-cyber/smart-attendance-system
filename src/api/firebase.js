// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";           // लॉगिनसाठी
import { getFirestore } from "firebase/firestore"; // डेटाबेससाठी

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALyxTCe1LETs9ylwMrV2f_bJqd4xyHiUI",
  authDomain: "smart-attendent-system.firebaseapp.com",
  projectId: "smart-attendent-system",
  storageBucket: "smart-attendent-system.firebasestorage.app",
  messagingSenderId: "987979353919",
  appId: "1:987979353919:web:33f3a56e32a804ad008d8a",
  measurementId: "G-RW4N9VXPZN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export these so you can use them in other files
export const analytics = getAnalytics(app);
export const auth = getAuth(app); 
export const db = getFirestore(app);