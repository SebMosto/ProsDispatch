## 2026-01-20 - Broken Local Environment
**Learning:** The local environment has broken `node_modules` binaries (`vite`, `tsc` missing) and dependency conflicts (`@stripe`). This prevents running standard verification tools (`npm test`, `npm run lint`, dev server).
**Action:** Rely on manual code verification and strict syntax checking when environment tools fail. Document these failures clearly in PRs.

## 2026-05-21 - React List Rendering
**Learning:** Using mutable properties (like `description`) in `key` prop for list items causes full re-mounts on every keystroke, leading to focus loss and poor performance.
**Action:** Always use stable IDs for list items, especially in forms where items are editable. If IDs don't exist in backend data, generate client-side IDs.
