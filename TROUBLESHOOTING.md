# Troubleshooting Guide

This guide details resolutions for common issues when deploying or running StadiumIQ.

---

## 1. Firebase CLI Errors

### `Your project must be on the Blaze (pay-as-you-go) plan to complete this command`

- **Cause**: You tried running `firebase functions:secrets:set GEMINI_API_KEY="..."`. Secret Manager requires Google Cloud billing enabled.
- **Fix**: Do not use `secrets:set`. Instead, follow the instructions in the deployment guide to use environment configuration parameters or check `process.env.GEMINI_API_KEY` configured in the Cloud Function environment.

### `Authentication Error / Login Blocked`

- **Cause**: Your local Firebase CLI session is expired.
- **Fix**: Force re-authentication using your web browser:
  ```bash
  firebase login --reauth
  ```

---

## 2. Vercel Build & Runtime Issues

### `TS Config Reference Error`

- **Cause**: Monorepo references `@stadiumiq/tsconfig` or eslint definitions cannot be resolved.
- **Fix**: Verify your Vercel project's **Root Directory** is pointing to `apps/fan-app` (or the relevant app folder). Vercel requires access to package presets at the root level. Ensure the Vercel build settings do not prevent reading the root configuration files.

### `Firebase Client Init: "Invalid Credentials"`

- **Cause**: You forgot to set environment variables or typoed them in your Vercel Project Settings dashboard.
- **Fix**:
  1. Open your Vercel Dashboard.
  2. Select the app, go to **Settings** > **Environment Variables**.
  3. Confirm that all `VITE_FIREBASE_*` variables match the values in your Firebase Web App configuration object.
  4. Redeploy the project to apply the environment changes.

---

## 3. Database Seeding Failures

### `seedFirestore triggers a 500 error / CORS timeout`

- **Cause**: Firestore database has not been initialized.
- **Fix**:
  1. Go to the [Firebase Console](https://console.firebase.google.com/).
  2. Under **Build**, select **Firestore Database**.
  3. Ensure you have clicked **Create Database** and selected a location.
  4. Ensure your security rules are initialized.
