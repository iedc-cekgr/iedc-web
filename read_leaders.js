import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJ805dHnMGaoB5XRG6d8piZ9PvIK8KTps",
  authDomain: "iedc-website-ab4e0.firebaseapp.com",
  projectId: "iedc-website-ab4e0",
  storageBucket: "iedc-website-ab4e0.firebasestorage.app",
  messagingSenderId: "772463365866",
  appId: "1:772463365866:web:4ca909fbcd68ecefe21193"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const querySnapshot = await getDocs(collection(db, "past_leaders"));
  querySnapshot.forEach((d) => {
    console.log(d.id, " => ", d.data());
  });
}
main();
