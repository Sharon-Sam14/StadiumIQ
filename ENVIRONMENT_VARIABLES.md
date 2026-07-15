# Environment Variables Guide

This document lists all configuration variables required for running StadiumIQ in serverless development and production modes.

---

## 1. Frontend Client Env (Vite & Next.js)

Place these variables in your Vercel deployment parameters or local `.env` files:

```env
# Firebase Connection details
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="stadiumiq-serverless.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="stadiumiq-serverless"
VITE_FIREBASE_STORAGE_BUCKET="stadiumiq-serverless.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:1234:web:abcd"
```

---

## 2. Backend Serverless Env (Cloud Functions)

Configure this parameter on your Firebase CLI before deploying:

```env
# Google Gemini API Auth Key
GEMINI_API_KEY="your-google-ai-studio-gemini-key"
```
