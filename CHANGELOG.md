# Changelog

All notable changes to the StadiumIQ platform are documented below.

## [1.1.0] - 2026-07-15
### Added
- Created `functions/` serverless Cloud Functions package executing AI Chat RAG prompts and concessions overstock pricing adjustments.
- Set up local Firebase Emulator configurations inside `firebase.json`, `firestore.rules`, and `storage.rules`.
- Integrated `apps/fan-app` views with Cloud Firestore snapshots and authentication.
- Created `API.md`, `SECURITY.md`, `DEPLOYMENT.md`, and `TESTING.md`.

### Removed
- Deleted obsolete `services/` microservice directories, Prisma clients, and Docker configurations.
