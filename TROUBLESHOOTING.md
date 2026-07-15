# Troubleshooting Guide

This guide details resolutions for common issues when running StadiumIQ.

---

## 1. Firebase Emulator Connection Failures
* **Symptom**: Frontend console throws `connection refused` on ports `8080`, `5001`, or `9099`.
* **Fix**: Ensure that the emulators have been fully initialized and are currently active:
  ```bash
  firebase emulators:start
  ```
  Check that local system ports are not bound by previous Docker composition containers.

---

## 2. Gemini AI Key Failures
* **Symptom**: GenAI chatbot displays "(Offline Fallback)" in the conversation thread.
* **Fix**: Verify that `GEMINI_API_KEY` is defined in the Cloud Functions emulator environment. Make sure to export the variable before running the emulator locally:
  ```bash
  $env:GEMINI_API_KEY="your-api-key"
  ```
