import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Default configuration with fallback properties for local emulator execution
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key-stadiumiq",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "stadiumiq-serverless.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "stadiumiq-serverless",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "stadiumiq-serverless.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234:web:abcd",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Enable local emulator connection when running locally in development mode
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
  connectFunctionsEmulator(functions, "localhost", 5001);
  connectStorageEmulator(storage, "localhost", 9199);
}
export default app;
