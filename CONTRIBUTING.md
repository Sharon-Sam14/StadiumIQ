# Contributing to StadiumIQ

We welcome contributions to help refine StadiumIQ's serverless stadium operations ecosystem.

## Coding Guidelines

1. **TypeScript Typing**: Write type definitions for all Firestore documents and function triggers. Avoid `any` type casts where possible.
2. **Lint & Code Style**: Run `npm run lint` and verify there are no errors or warnings before committing. Format files using Prettier:
   ```bash
   npm run format
   ```
3. **Tests**: Add unit/integration tests for any logic adjustments inside `__tests__/` subdirectories. Ensure all tests run successfully via:
   ```bash
   npm run test
   ```
4. **Git Commits**: Commit messages must follow Conventional Commit rules (e.g. `feat: ...`, `fix: ...`, `docs: ...`).
