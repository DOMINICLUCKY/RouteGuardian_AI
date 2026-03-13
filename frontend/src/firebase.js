import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAnOh9ynLNB6Ez86akjqEMPCs2TZDyKqaY",
  authDomain: "routeguardianai.firebaseapp.com",
  projectId: "routeguardianai",
  storageBucket: "routeguardianai.firebasestorage.app",
  messagingSenderId: "603002384400",
  appId: "1:603002384400:web:8abbfbf23ceeee7b4cda95",
  measurementId: "G-1HQ58EZGDW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();