# StadiumIQ Security Policy & Hardening Manual

This policy covers the defense-in-depth security layers configured to protect event organizers, volunteers, and event fans.

---

## 1. Firebase Authentication & Claims
- All client sessions are initialized and managed securely by **Firebase Authentication**.
- Sensitive REST APIs and mutations require a valid authenticated UID.
- Role-based authorizations (e.g., `fifa_admin`, `volunteer`) are validated through Firestore security rules.

---

## 2. Firestore Document Rules Policy
Access bounds are strictly restricted inside `firestore.rules`:
* **Read-only**: Open metrics datasets (such as sustainability leaderboards and match details) are readable by any client.
* **Write limitations**: Incident status updates and task assignments are locked. Writing to a user profile requires the request author UID to match the target path document ID.
* **No SQL injection vectors**: By using Firestore document collections instead of raw string SQL queries, the system is fully immune to SQL injection attacks.

---

## 3. Generative AI Secret Hardening
Google Gemini API tokens (`GEMINI_API_KEY`) are stored exclusively inside **Firebase Secrets Manager** on the Cloud Functions runner environment. Clients only interact with AI models through serverless HTTPS proxy gates, preventing key disclosure.

---

## 4. Frontend Headers & CSP
Vercel hosting is configured to append secure headers on all static HTML responses:
- `Content-Security-Policy`: Restricts scripts execution to verified hosts.
- `Strict-Transport-Security` (HSTS): Enforces HTTPS connections.
- `X-Content-Type-Options`: Blocks mime-sniffing leaks.
- `X-Frame-Options`: Enforces `DENY` frames to stop clickjacking.
