import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJ805dHnMGaoB5XRG6d8piZ9PvIK8KTps",
  authDomain: "iedc-website-ab4e0.firebaseapp.com",
  projectId: "iedc-website-ab4e0",
  storageBucket: "iedc-website-ab4e0.firebasestorage.app",
  messagingSenderId: "772463365866",
  appId: "1:772463365866:web:4ca909fbcd68ecefe21193"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
