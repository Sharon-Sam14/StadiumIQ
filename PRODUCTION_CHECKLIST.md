# Production Readiness Checklist

Verify all steps before deploy:

- [ ] **Auth Rules**: Lock down user and ticket collections in `firestore.rules`.
- [ ] **Secrets Manager**: Pinned Google Gemini key inside Firebase Secrets.
- [ ] **Linter check**: Verification shows 0 warnings (`npm run lint`).
- [ ] **Vitest check**: Confirm 80/80 tests pass successfully (`npm run test`).
- [ ] **Production build**: Build completes successfully across all active workspaces.
- [ ] **Headers check**: Verify Content-Security-Policy (CSP) headers are configured on Vercel deployment logs.
- [ ] **Accessibility check**: Confirm Skip-to-content links and keyboard focuses behave correctly across all views.
