# Firebase Serverless Infrastructure Setup

This document describes how to configure, seed, and run the serverless backend services for StadiumIQ.

## Prerequisites
- Node.js v20+
- Firebase CLI tool installed globally:
  ```bash
  npm install -g firebase-tools
  ```

---

## 1. Local Development (Firebase Emulator Suite)

StadiumIQ is configured to fully mock databases, cloud functions, and authentication engines locally.

### Start the Emulators
From the repository root, execute:
```bash
firebase emulators:start
```

This launches:
- **Firestore Emulator** on `localhost:8080`
- **Functions Emulator** on `localhost:5001`
- **Auth Emulator** on `localhost:9099`
- **Storage Emulator** on `localhost:9199`
- **Emulator Console UI** on `localhost:4000`

### Seed the Firestore Emulator
Once the emulators are running, seed default event matches and user profiles by calling the seeding endpoint:
```bash
curl http://localhost:5001/stadiumiq-serverless/us-central1/seedFirestore
```

---

## 2. Production Provisioning

To deploy to live Firebase instances:

1. **Create a Firebase Project** in the [Firebase Console](https://console.firebase.google.com).
2. **Enable Services**:
   - Enable **Cloud Firestore** in production mode.
   - Enable **Firebase Authentication** (Google / Email).
   - Upgrade the project to the **Blaze plan** (required for deploying Cloud Functions).
3. **Configure Environment Secrets**:
   Set your Google Gemini API key on the functions config parameters:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY="your_api_key_here"
   ```
4. **Deploy all configuration rules and functions**:
   ```bash
   firebase deploy
   ```
