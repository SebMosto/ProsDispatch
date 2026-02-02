## 2026-01-20 - Broken Local Environment
**Learning:** The local environment has broken `node_modules` binaries (`vite`, `tsc` missing) and dependency conflicts (`@stripe`). This prevents running standard verification tools (`npm test`, `npm run lint`, dev server).
**Action:** Rely on manual code verification and strict syntax checking when environment tools fail. Document these failures clearly in PRs.

## 2026-01-20 - Unstable Keys in Invoice Forms
**Learning:** Using mutable data (like description) in `key` props (`${description}-${index}`) causes input focus loss and excessive re-rendering. This is a critical usability and performance anti-pattern.
**Action:** Always generate stable, random IDs (`crypto.randomUUID()`) for dynamic lists, even if the backend doesn't provide them initially.
