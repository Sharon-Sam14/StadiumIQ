# Environment Variables Guide

This document lists all configuration variables required for running StadiumIQ in serverless development and production modes.

---

## 1. Frontend Client Env (Vite & Next.js)

Place these variables in your Vercel deployment parameters or local `.env` files:

```env
# Firebase Connection details (Obtained from Firebase Console > Web App Configuration)
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="stadiumiq-4d239.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="stadiumiq-4d239"
VITE_FIREBASE_STORAGE_BUCKET="stadiumiq-4d239.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:1234:web:abcd"
```

- **`VITE_FIREBASE_API_KEY`**: Authenticates client browser requests to Firebase servers.
- **`VITE_FIREBASE_AUTH_DOMAIN`**: Directs authentication login redirects.
- **`VITE_FIREBASE_PROJECT_ID`**: Links Firestore and Database API calls to your specific Firebase Project space.
- **`VITE_FIREBASE_STORAGE_BUCKET`**: Bucket storage domain where file uploads are hosted.
- **`VITE_FIREBASE_MESSAGING_SENDER_ID`**: Identifier for cloud message triggers.
- **`VITE_FIREBASE_APP_ID`**: Identifies your web portal application registration inside the Firebase account.

---

## 2. Backend Serverless Env (Cloud Functions)

### Local Emulator Mode

Save this key inside your local `.env` file at the root of the project to test Gemini features:

```env
# Google Gemini API Auth Key (Obtained from Google AI Studio)
GEMINI_API_KEY="your-google-ai-studio-gemini-key"
```

### Production Mode (Firebase Spark Free Tier)

Because we are utilizing the Free Spark Plan, we cannot use Firebase Secret Manager (which requires a Blaze upgrade). In production, configure the key by injecting it as a Cloud Functions environment parameter in your runtime dashboard or code configurations.
