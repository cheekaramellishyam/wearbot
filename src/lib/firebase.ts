import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import configFromJson from "../../firebase-applet-config.json";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDXEym_ILbORB34qrt79h9HdqvBPkuXoG0",
  authDomain: "gen-lang-client-0233975313.firebaseapp.com",
  projectId: "gen-lang-client-0233975313",
  storageBucket: "gen-lang-client-0233975313.firebasestorage.app",
  messagingSenderId: "942026614852",
  appId: "1:942026614852:web:81e89b0dad2ef6b875b411",
  ...configFromJson,
};

// Initialize Firebase singleton safely
export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// Initialize Firestore Database
export const db: Firestore = getFirestore(app);

export default app;
