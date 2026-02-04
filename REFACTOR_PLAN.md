# Refactoring Plan & i18n Audit

## Summary of Audit
An extensive audit of the codebase was conducted to identify Internationalization (i18n) technical debt, specifically focusing on "Garbled" UI (concatenated text) and hardcoded strings.

### Findings

1.  **"Concatenated" Text / Garbled UI:**
    -   **Status:** Not found in core components (`App.tsx`, `Sidebar.tsx`, `HomePage.tsx`).
    -   **Explanation:** The "concatenated text" issue reported by the user (English text immediately followed by French text) was not reproducible in the examined components. These components correctly use `i18next`'s `t()` function. The issue might be an artifact of a specific data state or a legacy component not present in the current file list.
    -   **Action:** No direct component edits were required for this specific symptom, as the code appears correct.

2.  **Hardcoded Strings:**
    -   **Status:** Found and Fixed.
    -   **Location:** `src/hooks/useInvoices.ts`.
    -   **Detail:** The hook was throwing errors with hardcoded English strings ("Invoice ID is required").
    -   **Fix:** Refactored to use `useTranslation` and localized keys (`validation.invoiceIdRequired`, `validation.invoiceTokenRequired`).

3.  **Missing Localization Helpers:**
    -   **Status:** Fixed.
    -   **Action:** Created `src/lib/date.ts` for localized date formatting.
    -   **Action:** Refactored `src/lib/currency.ts` to enforce robust locale detection and performance caching.

4.  **Offline Persistence:**
    -   **Status:** Verified.
    -   **Detail:** `src/i18n/index.ts` is correctly configured with `i18next-browser-languagedetector` using `localStorage`. No changes were needed.

5.  **React Version Mismatch:**
    -   **Status:** Fixed.
    -   **Detail:** The project had `react` at `^18.3.1` and `react-dom` at `^19.2.3`, causing runtime crashes (`Cannot read properties of undefined (reading 'S')`).
    -   **Fix:** Aligned both to `^19.0.0` to ensure stability and compatibility.

## Future Steps
1.  **Continuous Monitoring:** Watch for reports of "concatenated text". If it reappears, inspect the *data* layer (e.g., database content) as it might be stored bilingually.
2.  **Automated Checks:** Continue using `npm run check:i18n` to prevent regression.
3.  **Validation:** Ensure all new Zod schemas use the `get*Schema(t)` pattern.
