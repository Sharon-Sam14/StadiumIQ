# Firebase Infrastructure & Setup Guide for StadiumIQ

This document details the configuration and structure of StadiumIQ's Firebase services: Cloud Functions v2, Cloud Firestore, Firebase Authentication, and Firebase Storage.

---

## 🏗️ Firebase File Configuration Audit

### 1. `firebase.json`

- **Status**: **Valid**
- **Verification**:
  - Correctly points to [firestore.rules](./firestore.rules) and [firestore.indexes.json](./firestore.indexes.json).
  - Specifies the Node.js `functions` workspace source path directory.
  - Declares ports for the Auth emulator (`9099`), Functions emulator (`5001`), Firestore emulator (`8080`), and Storage emulator (`9199`).

### 2. `firestore.rules`

- **Status**: **Valid & Locked Down**
- **Verification**:
  - Blocks open read/writes.
  - Permits authenticated reads for profiles, but locks mutations unless the requesting user UID matches the target profile UID (`request.auth.uid == userId`) or they have `fifa_admin` role credentials.
  - Incidents and volunteer task writes are restricted using role checkers (`hasRole('volunteer')`, `hasRole('fifa_admin')`).
  - Public collections (like `challenges`, `venues`, `matches`, and `rewards`) are set to read-only (`allow read: if true;`) to prevent unauthorized changes while remaining readable.

### 3. `firestore.indexes.json`

- **Status**: **Valid**
- **Verification**:
  - Mapped compound indexes on the `leaderboards` collection to sort queries by `xpPoints` or `ecoPoints` in descending order.

### 4. `storage.rules`

- **Status**: **Valid**
- **Verification**:
  - Requires a valid authenticated user account session (`request.auth != null`) to upload files.

---

## 🛠️ Step-by-Step Backend Configuration

### 1. Enable Firebase Authentication

1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. In the sidebar menu under **Build**, click **Authentication**.
4. Click **Get Started**.
5. Under the **Sign-in method** tab:
   - **Email/Password**: Click, toggle _Enable_, and click **Save**.
   - **Google**: Click, toggle _Enable_, choose a project support email, and click **Save**.

### 2. Set Up Cloud Firestore Database

1. In the Firebase console sidebar under **Build**, click **Firestore Database**.
2. Click **Create database**.
3. Set Security Rules to **Production Mode** (this will load your local [firestore.rules](./firestore.rules) policy file upon deployment).
4. Choose your database location/region (e.g. `us-central1` or `europe-west3`). Select a region close to your primary audience.
5. Click **Create** to initialize the database collections.

### 3. Set Up Firebase Storage Bucket

1. In the Firebase console sidebar under **Build**, click **Storage**.
2. Click **Get Started**.
3. Choose **Production Mode** rules.
4. Select your location and click **Done**.
5. Firebase will provision your default storage bucket path (`stadiumiq-4d239.appspot.com` or similar).

---

## 💥 Crucial Spark Plan Refactoring (Avoiding Blaze Upgrade Fees)

> [!WARNING]
> By default, the Firebase CLI command `firebase functions:secrets:set` requires enabling the **Google Cloud Secret Manager API**, which requires a Firebase **Blaze (Pay-as-you-go) Plan** upgrade.
> To deploy 100% free under the **Spark Plan**, follow the instructions in the main deployment guide to switch from Cloud Secrets to standard environment configuration parameters.
