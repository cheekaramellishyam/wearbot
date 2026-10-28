import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import configFromJson from "../../firebase-applet-config.json";

// Your web app's Firebase configuration
export const firebaseConfig = {
  ...configFromJson,
  apiKey: configFromJson.apiKey || "AIzaSyDXEym_ILbORB34qrt79h9HdqvBPkuXoG0",
  authDomain: configFromJson.authDomain || "gen-lang-client-0233975313.firebaseapp.com",
  projectId: configFromJson.projectId || "gen-lang-client-0233975313",
  storageBucket: configFromJson.storageBucket || "gen-lang-client-0233975313.firebasestorage.app",
  messagingSenderId: configFromJson.messagingSenderId || "942026614852",
  appId: configFromJson.appId || "1:942026614852:web:81e89b0dad2ef6b875b411",
};

// Initialize Firebase singleton safely
export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// Initialize Firestore Database
export const db: Firestore = getFirestore(app);

export default app;
