import {
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "./firebase";

export const SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});

export interface GoogleUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  initials: string;
}

/**
 * Extracts 1-2 letter initials from a name (e.g., "Cheekaramelli Shyam" -> "CS")
 */
export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  if (email && email.trim()) {
    const userPart = email.split("@")[0].replace(/[^a-zA-Z]/g, "");
    return userPart.slice(0, 2).toUpperCase() || "U";
  }

  return "U";
}

/**
 * Maps a Firebase User to our GoogleUserProfile interface
 */
export function mapUserToProfile(user: User): GoogleUserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    initials: getInitials(user.displayName, user.email),
  };
}

export async function signInWithGoogle(): Promise<GoogleUserProfile> {
  try {
    const result = await signInWithPopup(auth, provider);
    return mapUserToProfile(result.user);
  } catch (error: any) {
    if (error?.code === "auth/unauthorized-domain") {
      const currentHost = typeof window !== "undefined" ? window.location.hostname : "your app domain";
      const customErr = new Error(
        `Domain not authorized in Firebase. Please add "${currentHost}" in Firebase Console > Authentication > Settings > Authorized domains.`
      );
      (customErr as any).code = error.code;
      throw customErr;
    }
    if (error?.code === "auth/operation-not-allowed") {
      const customErr = new Error(
        'Google sign-in is not enabled. Go to Firebase Console > Authentication > Sign-in method and enable "Google".'
      );
      (customErr as any).code = error.code;
      throw customErr;
    }
    if (error?.code === "auth/popup-blocked") {
      const customErr = new Error(
        "Sign-in popup was blocked by your browser. Please allow popups for this window and try again."
      );
      (customErr as any).code = error.code;
      throw customErr;
    }
    throw error;
  }
}

export async function signOutGoogle(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuth(
  callback: (user: GoogleUserProfile | null) => void
): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(mapUserToProfile(user));
    } else {
      callback(null);
    }
  });
}
