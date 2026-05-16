## 2026-01-20 - Broken Local Environment
**Learning:** The local environment has broken `node_modules` binaries (`vite`, `tsc` missing) and dependency conflicts (`@stripe`). This prevents running standard verification tools (`npm test`, `npm run lint`, dev server).
**Action:** Rely on manual code verification and strict syntax checking when environment tools fail. Document these failures clearly in PRs.

## 2026-05-21 - React List Rendering
**Learning:** Using mutable properties (like `description`) in `key` prop for list items causes full re-mounts on every keystroke, leading to focus loss and poor performance.
**Action:** Always use stable IDs for list items, especially in forms where items are editable. If IDs don't exist in backend data, generate client-side IDs.

## 2026-06-15 - React List Rendering with Translations
**Learning:** When extracting list items to `React.memo` components that require localization, it's safer to call `useTranslation()` *inside* the memoized component rather than passing the `t` function as a prop. Passing `t` as a prop can break memoization if the reference is not perfectly stable, whereas calling it inside ensures the component only re-renders when the language actually changes or its specific props change.
**Action:** Always call hooks like `useTranslation` inside the memoized list item component instead of passing them down from the parent list.

## 2026-05-03 - React 18 Deferred Values for Large List Filtering
**Learning:** When filtering large lists in React 18+ based on user input, using `useDeferredValue` instead of custom debouncing prevents typing lag. It allows React to prioritize the input state updates while deferring the heavier filtering calculation, improving perceived performance without the complexity of managing custom timeout IDs.
**Action:** Use `useDeferredValue` for list filtering based on text inputs when the list length can grow significantly.
