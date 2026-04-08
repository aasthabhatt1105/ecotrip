import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCA8iIPokYrjjBLFU0rYpVEsJWMFaaNJCA",
  authDomain: "ecotrip-c82eb.firebaseapp.com",
  projectId: "ecotrip-c82eb",
  storageBucket: "ecotrip-c82eb.firebasestorage.app",
  messagingSenderId: "376296969711",
  appId: "1:376296969711:web:450b09ca12786c481c921a",
  measurementId: "G-0DYRYLKSHM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { 
  auth, db, storage, googleProvider, 
  signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, 
  collection, addDoc, query, where, getDocs, orderBy, 
  ref, uploadBytes, getDownloadURL 
};
