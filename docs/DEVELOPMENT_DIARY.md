# Development Diary

## 2026-04-14

- Reviewed the repository structure and confirmed it is a Vite React app.
- Started dependency installation with `npm install`.
- Added the project TODO and development diary files requested by workflow notes.
- Completed dependency installation and started the dev server with `npm run dev -- --host 0.0.0.0`.
- `npm install` finished with 12 reported vulnerabilities in the audit output.
- Verified the production build with `npm run build`; Vite completed successfully and reported a chunk size warning.
- Found the blank-page issue was caused by undefined icon components on the landing and guest login screens.
- Removed those runtime blockers and noted that several deeper routes still use the same icon pattern.
- Installed `lucide-react` and added imports to the remaining route pages so the next navigable screens can render.
- Added a local ESLint config and ignore file because the repo did not have one.
- Reworked the `UserApp.jsx` dispatch localization flow to remove the async promise executor warning.
- Repaired a syntax regression introduced during that edit and verified `npm run lint` completes cleanly.
- Added `vercel.json` with an SPA rewrite so React Router routes resolve correctly on Vercel.
- Deployed the app to Vercel and confirmed the production URL was created successfully.
- Updated logout and auth-guard redirects across guest/staff/admin pages to land on `/` (role selector) rather than `/login`.
- Fixed Admin Dashboard runtime failures (including analytics view) caused by missing `lucide-react` icon imports.
