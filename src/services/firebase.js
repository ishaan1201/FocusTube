// 📂 src/services/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// ⚠️ PASTE YOUR FIREBASE CONFIG HERE (Get this from console.firebase.google.com)
const firebaseConfig = {
  apiKey: "AIzaSyAz4Osh7gDJeYJvWp9mMpuOPvKQd6AXtmY",
  authDomain: "focustube-31070.firebaseapp.com",
  projectId: "focustube-31070",
  storageBucket: "focustube-31070.firebasestorage.app",
  messagingSenderId: "179088239900",
  appId: "1:179088239900:web:268e2c9fa8ca9dd4e1ded9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 🟢 Login with Google
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user exists in DB, if not, create them
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        bio: "Learning effectively on Curio.",
        createdAt: new Date().toISOString()
      });
    }

    return user;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

// 🔴 Logout
export const logoutUser = async () => {
  await signOut(auth);
};

// 🔵 Update Profile (Name & Bio)
export const updateUserProfile = async (uid, newName, newBio) => {
  const user = auth.currentUser;

  // 1. Update Auth Profile (Display Name)
  if (user && newName) {
    await updateProfile(user, { displayName: newName });
  }

  // 2. Update Firestore Doc (Bio & Name)
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    name: newName,
    bio: newBio
  });
};

// 🟡 Get User Profile Data from Firestore
export const getUserData = async (uid) => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
};