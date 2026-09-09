import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut,
  updateProfile,
  type Auth,
  type UserCredential,
} from "firebase/auth";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Amrita Connect Firebase Web App Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBGg_3X6A_yW3tsLVMooNdEpg1a8wDctRs",
  authDomain: "amritaconnect-68619.firebaseapp.com",
  projectId: "amritaconnect-68619",
  storageBucket: "amritaconnect-68619.firebasestorage.app",
  messagingSenderId: "239058716670",
  appId: "1:239058716670:web:c5151d634939a25de662af",
  measurementId: "G-B8XFQZP30H",
};

// Singleton Firebase initialization
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Analytics is only initialized in browser environments where supported
export let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics not supported or blocked by client
    });
}

/**
 * Maps Firebase Auth error codes to user-friendly messages.
 */
export function getFirebaseErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  const code = error?.code || "";
  switch (code) {
    case "auth/user-not-found":
      return "No account found with this email address. Please check your spelling or register a new account.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Incorrect email or password. Please verify your credentials or use 'Forgot password' below.";
    case "auth/email-already-in-use":
      return "An account with this email address already exists. Please sign in instead.";
    case "auth/weak-password":
      return "The password is too weak. Please choose a password with at least 8 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many unsuccessful attempts. Access to this account has been temporarily disabled. Please reset your password or wait a few minutes.";
    case "auth/popup-closed-by-user":
      return "Google sign-in popup was closed before finishing authentication.";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked by your browser. Please allow popups for this site.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase. Please ensure localhost is added in Firebase Console > Authentication > Settings > Authorized Domains.";
    case "auth/configuration-not-found":
    case "auth/operation-not-allowed":
      return "Firebase Authentication needs to be enabled in Firebase Console. Go to: Firebase Console → Build → Authentication → Click 'Get started' → Enable 'Email/Password'.";
    case "auth/network-request-failed":
      return "Network connection issue. Please check your internet connection and try again.";
    default:
      return error.message || "Authentication failed. Please try again.";
  }
}

/**
 * Sign in using Firebase Email & Password
 */
export async function firebaseLogin(email: string, password: string): Promise<UserCredential> {
  return await signInWithEmailAndPassword(auth, email.trim(), password);
}

/**
 * Register a new user using Firebase Email & Password
 */
export async function firebaseRegister(email: string, password: string, displayName?: string): Promise<UserCredential> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName && cred.user) {
    try {
      await updateProfile(cred.user, { displayName });
    } catch {
      // Non-critical profile update failure
    }
  }
  return cred;
}

/**
 * Send a secure password reset email via Firebase
 */
export async function firebaseSendPasswordReset(email: string): Promise<void> {
  return await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign in or sign up with Google via Firebase
 */
export async function firebaseSignInWithGoogle(): Promise<UserCredential> {
  return await signInWithPopup(auth, googleProvider);
}

/**
 * Sign out from Firebase
 */
export async function firebaseLogout(): Promise<void> {
  return await signOut(auth);
}
