# Complete Step-by-Step Beginner Deployment Guide for StadiumIQ (Free Tier Only)

This guide walks you through deploying the **StadiumIQ** platform from absolute scratch.

We will configure and deploy the entire project using **only 100% Free Tiers**:

- **Firebase Spark Plan** (Databases, Auth, Hosting, Storage, Functions free limits)
- **Google AI Studio** (Free Gemini API Key)
- **Vercel Hobby Plan** (Frontend hosting)
- **GitHub Free Plan** (Code repository)

---

## 🛠️ Step-by-Step Walkthrough

### STEP 1: Create a Firebase Project

1. Open your web browser and go to the [Firebase Console](https://console.firebase.google.com/).
2. Click the large card **Add project** (or **Create a project**).
3. **Project name**: Type `stadiumiq-prod` (Firebase will append a unique ID like `stadiumiq-prod-4d239`). Click **Continue**.
4. **Google Analytics**: Toggle _Enable Google Analytics for this project_ to **OFF** (this keeps the creation process simple and fast).
5. Click **Create project**.
6. Wait for the loading animation to complete, then click **Continue**.

- **Expected Output**: You are redirected to your project's Firebase Dashboard.
- **Verification**: Verify that the top bar displays your project name.

---

### STEP 2: Enable Authentication

1. On your Firebase Dashboard sidebar, click the **Build** dropdown menu, then click **Authentication**.
2. Click the **Get Started** button.
3. In the list of **Sign-in providers**, click **Email/Password**.
4. Toggle the **Enable** switch to ON (leave _Email link (passwordless sign-in)_ disabled). Click **Save**.
5. Click the **Add new provider** button.
6. Select **Google** from the list.
7. Toggle the **Enable** switch to ON.
8. Choose a **Project support email** from the dropdown menu (select your login Gmail account).
9. Click **Save**.

- **Expected Output**: The Sign-in providers list shows _Email/Password_ and _Google_ as "Enabled".
- **Verification**: Confirm that both providers are listed as active.

---

### STEP 3: Create Cloud Firestore Database

1. On your Firebase Dashboard sidebar, click **Build** and select **Firestore Database**.
2. Click the **Create database** button.
3. **Firestore Security Rules**: Select **Start in production mode** (this ensures the database is secure; we will deploy your local firestore rules next). Click **Next**.
4. **Firestore Location**: Choose a region closest to your location (e.g., `us-central1` or `europe-west3`).
5. Click **Create**.

- **Expected Output**: A dashboard displaying empty Firestore collections.
- **Verification**: Verify that the rules tab is showing.

---

### STEP 4: Create Cloud Storage Bucket

1. On your Firebase Dashboard sidebar, click **Build** and select **Storage**.
2. Click the **Get Started** button.
3. Select **Start in production mode** rules and click **Next**.
4. Choose the default Cloud Storage location (it should match your Firestore database location). Click **Done**.

- **Expected Output**: An empty Storage bucket directory.
- **Verification**: Verify that you see a bucket path like `gs://stadiumiq-prod-4d239.appspot.com`.

---

### STEP 5: Install Firebase CLI

1. Open a terminal on your computer.
2. Install the Firebase Command Line Interface (CLI) globally:
   ```bash
   npm install -g firebase-tools
   ```

- **Expected Output**: Installation progress bar completes.
- **Common Errors & Fixes**:
  - _Error: Permission Denied_: On Windows, open your command prompt as Administrator; on Mac/Linux, run `sudo npm install -g firebase-tools`.
- **Verification**: Verify the CLI is installed by running:
  ```bash
  firebase --version
  ```

---

### STEP 6: Log in to Firebase CLI

1. In your terminal, run:
   ```bash
   firebase login
   ```
2. Your web browser will open automatically and ask you to log in to your Google Account.
3. Sign in using the same Google Account you used to create the Firebase project in Step 1.
4. Click **Allow** to authorize the Firebase CLI.

- **Expected Output**: The terminal will print `✔  Success! Logged in as your-email@gmail.com`.
- **Common Errors & Fixes**:
  - _Error: Browser doesn't open_: Run `firebase login --no-localhost` and copy the authentication URL manually.
- **Verification**: Confirm that your account email is displayed in the terminal.

---

### STEP 7: Initialize Project

Our repository already contains configuration files: [firebase.json](./firebase.json), [firestore.rules](./firestore.rules), and [storage.rules](./storage.rules). We do not need to generate new configurations.

1. Make sure your terminal is opened in the project root directory: `c:\Users\sharo\Desktop\promptwar`.

---

### STEP 8: Connect Your Existing Firebase Project

1. Run this command to link your local code to your new Firebase project:
   ```bash
   firebase use --add
   ```
2. The CLI will list your Firebase projects. Use the arrow keys to select the project you created in Step 1 (e.g. `stadiumiq-prod-4d239`). Press **Enter**.
3. **What alias do you want to use for this project?**: Type `default` and press **Enter**.

- **Expected Output**: `Created alias default for stadiumiq-prod-4d239. Now using alias default (stadiumiq-prod-4d239)`.
- **Verification**: Verify the connection by running `firebase projects:list`. The active project will have an asterisk (`*`) next to it.

---

### STEP 9: Configure Environment Variables

You need to create your local env file to compile the applications.

1. In the project root, copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Navigate to the **Firebase Console** and open your project.
3. Click the gear icon next to **Project Overview** in the sidebar and select **Project settings**.
4. Scroll down to **Your apps**, click **Web app** (`</>`), name it `stadiumiq-web`, and click **Register app**.
5. Copy the credentials inside the `firebaseConfig` object.
6. Open your local [.env](file:///c:/Users/sharo/Desktop/promptwar/.env) file and fill in the values:
   - **`VITE_FIREBASE_API_KEY`**: Your web API key.
   - **`VITE_FIREBASE_AUTH_DOMAIN`**: `<project-id>.firebaseapp.com`
   - **`VITE_FIREBASE_PROJECT_ID`**: Your exact project ID.
   - **`VITE_FIREBASE_STORAGE_BUCKET`**: `<project-id>.appspot.com`
   - **`VITE_FIREBASE_MESSAGING_SENDER_ID`**: Sender ID number.
   - **`VITE_FIREBASE_APP_ID`**: Web application registration ID.

---

### STEP 10: Obtain a Free Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Log in with your Google Account.
3. Click **Get API key** in the sidebar.
4. Click **Create API Key**.
5. Select your Google Cloud Project or choose **Create API Key in new project**.
6. Copy the generated key.

> [!IMPORTANT]
> **Free Spark Plan Billing Workaround**:
> Normally, Cloud Functions secrets require running `firebase functions:secrets:set GEMINI_API_KEY="..."`. This command requires enabling the Google Cloud Secret Manager API, which requires upgrading to the Firebase **Blaze (Pay-as-you-go) Plan**.
>
> To stay **100% Free** under the **Spark Plan**, edit your local functions code to read from configuration parameters, or configure your Gemini API Key directly under standard functions configuration options on the Google Cloud functions parameters panel.

---

### STEP 11: Deploy Firebase Services

1. Run the deployment command from the repository root:
   ```bash
   firebase deploy
   ```

- **Expected Output**: The terminal will print deployment success messages for rules, indexes, and Cloud Functions.
- **Verification**: Verify that the Cloud Functions tab in your Firebase Console displays the four active endpoints (`seedFirestore`, `aiConcierge`, `getVolunteerAnalytics`, `autonomicConcessionOptimiser`).

---

### STEP 12: Seed the Database

1. Find the HTTP URL for `seedFirestore` in the Firebase deployment output or inside the Functions dashboard.
2. Trigger the seeding using curl or your browser:
   ```bash
   curl https://us-central1-stadiumiq-prod-4d239.cloudfunctions.net/seedFirestore
   ```

- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Firestore database successfully seeded!"
  }
  ```
- **Verification**: Go to your **Firestore Database** dashboard and verify that collections like `matches`, `venues`, `tickets`, and `rewards` are populated.

---

### STEP 13, 14, 15: Deploy Frontends to Vercel

See the complete steps detailed in **[VERCEL_SETUP.md](./VERCEL_SETUP.md)** to import the monorepo, set build/output paths, add your env vars, and deploy each app:

1. **Fan Portal PWA**:
   - **Root Directory**: `apps/fan-app`
   - **Build Command**: `npx turbo run build --filter=@stadiumiq/fan-app`
   - **Output Directory**: `dist`
2. **Volunteer Portal**:
   - **Root Directory**: `apps/volunteer-portal`
   - **Build Command**: `npx turbo run build --filter=@stadiumiq/volunteer-portal`
   - **Output Directory**: `dist`
3. **Operations Command Center**:
   - **Root Directory**: `apps/command-center`
   - **Build Command**: `npx turbo run build --filter=@stadiumiq/command-center`
   - **Output Directory**: `.next`

---

### STEP 16: Configure Vercel Project Environment Variables

Make sure to add the six `VITE_FIREBASE_*` environment variables to each of your Vercel projects under **Settings** > **Environment Variables** (see [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)).

---

### STEP 17: Test the Deployment

1. Open your live Vercel Fan Portal URL.
2. Create a test account or log in.
3. Click the AI Concierge tab and send a message. Verify that the Gemini chatbot answers your query.
4. Verify that matches, venues, and ticket views load the values seeded in Step 12.
