## 2026-01-20 - Broken Local Environment
**Learning:** The local environment has broken `node_modules` binaries (`vite`, `tsc` missing) and dependency conflicts (`@stripe`). This prevents running standard verification tools (`npm test`, `npm run lint`, dev server).
**Action:** Rely on manual code verification and strict syntax checking when environment tools fail. Document these failures clearly in PRs.
