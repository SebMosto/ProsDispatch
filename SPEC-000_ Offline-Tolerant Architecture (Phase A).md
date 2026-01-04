\# SPEC-000: Offline-Tolerant Architecture (Phase A)

\*\*Status:\*\* APPROVED (Canonical v1.1 – Post-CTO Patch)  
\*\*Phase:\*\* 0 (Foundation Architecture)  
\*\*Owner:\*\* Chief Architect (ChatGPT) / Auditor (Gemini)  
\*\*Applies To:\*\* MVP1 (Restart Track)  
\*\*Aligned With:\*\* \`docs/MVP1\_PRD.md\`, \`SpecDoctrine.md\`, Law 25 / PIPEDA (Data Minimization), \`docs/patterns/UX-Responsive-01.md\`

\---

\#\# 0\. Executive Summary

We are \*\*NOT\*\* implementing full local-first sync (e.g., PowerSync) in MVP1.

However, we \*\*MUST\*\* guarantee:  
\- \*\*No data loss\*\* if a Service Provider is offline (e.g., basement, jobsite dead zone).  
\- \*\*Fast UI\*\* under slow networks.  
\- \*\*Clear user truth\*\*: users must understand whether a record is \*\*Draft (device-only)\*\* or \*\*Synced (cloud)\*\*.

\*\*Strategy:\*\* Offline-Tolerant (Phase A)  
\- Repository Pattern (UI never calls Supabase)  
\- Draft persistence (localStorage or IndexedDB)  
\- Optimistic mutations (React Query)  
\- UX indicators (Offline \+ Draft \+ Sync state)  
\- MVP1 conflict strategy: \*\*Last-Write-Wins (LWW)\*\* \+ explicit Draft state

\---

\#\# 1\. Goals & Non-Goals

\#\#\# 1.1 Goals (MVP1)  
1\. \*\*No draft data loss\*\* while offline or on refresh/crash.  
2\. \*\*UI never talks to Supabase directly\*\* (strict layering).  
3\. \*\*Optimistic UX\*\*: user actions feel instant.  
4\. \*\*Explicit sync state\*\*: Draft vs Synced must be visually obvious.  
5\. \*\*Simple conflict strategy\*\*: LWW is acceptable; avoid complex merge logic.

\#\#\# 1.2 Non-Goals (MVP1)  
\- Full bidirectional sync engine  
\- Automatic conflict resolution beyond LWW  
\- Multi-device offline reconciliation guarantees  
\- Encrypted local database (optional future hardening; see §10)

\---

\#\# 2\. Canonical Architecture Rules (Hard Constraints)

\#\#\# 2.1 Layering Doctrine (MANDATORY)  
\*\*UI Components MUST NOT:\*\*  
\- import \`supabase\` client  
\- call \`supabase.from(...)\`  
\- call REST endpoints directly for core domain entities

\*\*UI Components MUST:\*\*  
\- call \*\*Repository methods\*\* (e.g., \`JobRepository.create(input)\`).  
\- interact with data via \*\*Domain Hooks\*\* (e.g., \`useJobs()\`, \`useCreateJob()\`), which call repositories.

\#\#\# 2.2 Single Source of Truth for Cloud I/O  
Only these layers may touch Supabase:  
\- \`src/repositories/\*\`  
\- \`src/lib/supabase.ts\` (client init only)

\#\#\# 2.3 Offline Safety Rule  
Any multi-field creation/edit flow (Client, Property, Job, Invoice) MUST:  
\- auto-save user inputs locally,  
\- recover state after refresh,  
\- clearly mark the state as “Saved on device” when offline.

\---

\#\# 3\. Folder Structure (Canonical)

src/  
lib/  
supabase.ts  
network.ts  
syncState.ts  
repositories/  
baseRepository.ts  
clientRepository.ts  
propertyRepository.ts  
jobRepository.ts  
hooks/  
queries/  
useClients.ts  
useProperties.ts  
useJobs.ts  
mutations/  
useCreateClient.ts  
useCreateProperty.ts  
useCreateJob.ts  
persistence/  
draftStore.ts  
usePersistentForm.ts  
components/  
system/  
OfflineBanner.tsx  
SyncBadge.tsx  
i18n/  
...  
docs/  
specs/  
SPEC-000\_Architecture\_Offline.md

\---

\#\# 4\. Data Flow: How the App Works

\#\#\# 4.1 Read Path (Online / Offline tolerant)  
\- UI calls \`useClients()\` (React Query hook)  
\- Hook calls \`ClientRepository.list()\`  
\- Repository calls Supabase when online  
\- When offline, repository returns:  
  \- cached React Query data (if present) OR  
  \- an empty state with “Offline” UX message

\*\*MVP1 baseline:\*\* We rely on React Query caching for read continuity.    
\*\*Drafts do not automatically appear in list reads\*\* unless explicitly defined by the feature spec (see §7.4).

\#\#\# 4.2 Write Path (Create / Update)  
\- UI uses \`usePersistentForm(...)\` to continuously store draft inputs.  
\- On Save:  
  \- If online: optimistic mutation \-\> repository writes to Supabase \-\> reconcile.  
  \- If offline: save remains \*\*Draft (device-only)\*\* and user is told “Saved on device”.

\---

\#\# 5\. Network State & App Sync State

\#\#\# 5.1 Network Detection (Canonical)

Network state MUST be determined using \*\*two signals\*\*:

1\. Browser connectivity:  
   \- \`navigator.onLine\`  
   \- \`online\` / \`offline\` events

2\. API failure detection:  
   \- Any Supabase request failing with:  
     \- Network Error  
     \- Timeout  
     \- HTTP 408  
     \- HTTP 503  
   MUST transition the app into OFFLINE state.

Rationale:  
\- Devices may be connected to a router without internet access.  
\- Users must not see “Online” while requests fail silently.

The OFFLINE banner must reflect \*\*actual ability to sync\*\*, not theoretical connectivity.

\#\#\# 5.2 Canonical Sync States  
We define a simple state machine for UX consistency.

\*\*States\*\*  
\- \`ONLINE\_SYNCED\` — online; cloud record saved; latest fetch ok  
\- \`ONLINE\_SYNCING\` — online; a mutation is pending  
\- \`OFFLINE\_DRAFT\` — offline; draft exists only on device  
\- \`ONLINE\_DRAFT\_PENDING\` — online again; draft exists and user may “Submit now”  
\- \`ERROR\_RETRYABLE\` — mutation failed; retry available

\---

\#\# 6\. Repository Pattern (Strict)

\#\#\# 6.1 Repository Interface (Example)  
\*\*File:\*\* \`src/repositories/baseRepository.ts\`

All repositories implement consistent method signatures:  
\- \`list(params)\`  
\- \`get(id)\`  
\- \`create(input)\`  
\- \`update(id, input)\`  
\- \`softDelete(id)\`

\#\#\# 6.2 Example: JobRepository.create  
\*\*File:\*\* \`src/repositories/jobRepository.ts\`

Rules:  
\- Accepts validated input only (Zod output).  
\- Adds \`contractor\_id\` server-side via Supabase RLS context (auth).  
\- Never logs PII.  
\- Returns typed result.

\#\#\# 6.3 Forbidden Imports Enforcement (CI)  
Any import of \`supabase\` from outside \`src/repositories/\*\` fails CI.  
(Implemented in Ironclad CI via forbidden patterns script.)

\---

\#\# 7\. Draft Persistence (No Data Loss)

\#\#\# 7.1 Draft Storage Location (MANDATORY) MVP1 \*\*MUST\*\* use \*\*IndexedDB\*\* for all draft persistence.   
Implementation standard: \- Use the lightweight \`idb-keyval\` library. \- Do not use \`localStorage\` for draft persistence.   
Rationale: \- IndexedDB is asynchronous (non-blocking). \- Higher storage limits. \- Safer for mobile webviews and low-memory devices.   
This choice is \*\*non-optional\*\* and must be enforced across all draft-capable flows.

\*\*Canonical Choice:\*\* Use IndexedDB via a minimal helper (e.g., \`idb-keyval\`) OR \`localforage\`.  
(Choose one and lock it in. Do not use multiple.)

\#\#\# 7.2 Draft Key Strategy  
Draft keys MUST include:  
\- entity type  
\- user (contractor) id  
\- form context

Example:  
\- \`draft:job:create:{contractorId}\`  
\- \`draft:client:edit:{contractorId}:{clientId}\`

\#\#\# 7.3 \`usePersistentForm\` Hook (MANDATORY)  
\*\*File:\*\* \`src/persistence/usePersistentForm.ts\`

Requirements:  
\- Writes on every keystroke (debounced \~250–500ms)  
\- Can hydrate initial values from stored draft  
\- Provides:  
  \- \`isDirty\`  
  \- \`lastSavedAt\`  
  \- \`clearDraft()\`  
  \- \`draftStatus\` (e.g., \`OFFLINE\_DRAFT\`)

\#\#\# 7.4 Drafts vs Cloud Records (MVP1 Rule)  
Drafts are not “real records” until explicitly submitted.  
Therefore:  
\- Drafts MUST NOT appear in normal “cloud list views” unless the feature spec explicitly adds “Drafts” UI.  
\- Draft submission is a user action (Save/Submit button).  
\- If user abandons draft, draft remains recoverable until cleared or expired.

\#\#\# 7.5 Draft Expiration (Optional but recommended)  
Drafts older than \*\*30 days\*\* may be pruned automatically.  
(Keep evidence: lastSavedAt.)

\---

\#\# 8\. Optimistic Mutations (React Query)

\#\#\# 8.1 Required Library  
React Query (\`@tanstack/react-query\`) is the canonical mutation/caching layer.

\#\#\# 8.2 Optimistic Create: Pattern  
For creates:  
\- Immediately reflect the new entity in the UI with a \*\*temporary client-generated ID\*\* (e.g., \`temp\_{uuid}\`).  
\- Mark it as \`pending\_sync: true\` in UI state (not DB field).  
\- On success, swap temp id with real id.  
\- On failure:  
  \- if offline → remain \`OFFLINE\_DRAFT\`  
  \- if online error → \`ERROR\_RETRYABLE\`

\#\#\# 8.3 Optimistic Update: Pattern  
For updates:  
\- Apply patch to cache immediately.  
\- On error, rollback to previous cached state and show retry banner.

\#\#\# 8.4 “Fire-and-Forget” Clarification  
We do \*\*NOT\*\* silently drop writes.  
“Fire-and-forget” means:  
\- user perceives instant success,  
\- system still tracks whether cloud write succeeded,  
\- UI reflects pending/error states.

\---

\#\# 9\. UX Indicators (Bilingual, Mobile-First)

\#\#\# 9.1 Offline Banner (Global)  
Component: \`src/components/system/OfflineBanner.tsx\`

\*\*When shown:\*\*  
\- \`navigator.onLine \=== false\`

\*\*Copy (EN):\*\*  
\- Title: “You’re offline”  
\- Body: “Changes are saved on your device. You can submit when you’re back online.”

\*\*Copy (FR-CA):\*\*  
\- Title: “Vous êtes hors ligne”  
\- Body: “Vos changements sont enregistrés sur votre appareil. Vous pourrez les envoyer quand vous serez de retour en ligne.”

\#\#\# 9.2 Sync Badge (Local to Forms / Records)  
Component: \`src/components/system/SyncBadge.tsx\`

Badges:  
\- ✅ Synced / Synchronisé  
\- ⏳ Syncing… / Synchronisation…  
\- 📱 Saved on device / Enregistré sur l’appareil  
\- ⚠️ Needs attention / Action requise

\#\#\# 9.3 Draft Recovery Prompt  
If a persisted draft exists when opening a form:  
\- Show a modal or inline callout:  
  \- EN: “Resume your draft?” \[Resume\] \[Discard\]  
  \- FR-CA: “Reprendre votre brouillon?” \[Reprendre\] \[Supprimer\]

\#\#\# 9.4 Mobile UX Requirements  
Must pass 320px layout rules:  
\- no horizontal scroll on key forms  
\- primary actions reachable (sticky bottom button allowed)  
\- touch targets ≥ 44px

\---

\#\# 10\. Conflict Strategy (MVP1)

\#\#\# 10.1 Cloud Conflicts (MVP1)  
We accept \*\*Last-Write-Wins\*\* at the record level.  
\- The latest cloud update timestamp wins.  
\- UI does not attempt field-level merges.

\#\#\# 10.2 Conflict Strategy (MVP1 — Canonical)

MVP1 enforces \*\*Pure Last-Write-Wins (LWW)\*\*.

Rules:  
\- The most recent successful write overwrites prior values.  
\- No pre-submit conflict checks.  
\- No diffing UI.  
\- No confirmation modals.

Rationale:  
\- Optimistic UX must remain instant.  
\- Network round-trips before submit break the offline-tolerant model.  
\- MVP1 users are single-actor contractors; collaborative editing is out of scope.

This is an intentional MVP constraint, not a limitation.

\#\#\# 10.3 Audit Safety  
We do not store sensitive free-text notes in drafts beyond what the spec allows (e.g., SPEC-002 forbids notes).  
Draft persistence must respect the same data minimization rules as the DB.

\---

\#\# 11\. Acceptance Criteria (Definition of Done)

\#\#\# 11.1 Repository Enforcement  
\- ✅ No UI file imports \`supabase\` directly.  
\- ✅ All Supabase calls occur only in \`src/repositories/\*\`.  
\- ✅ CI fails if forbidden import patterns occur.

\#\#\# 11.2 Draft Persistence  
\- ✅ Refresh during form entry does not lose data.  
\- ✅ Offline entry saves and restores draft.  
\- ✅ User can discard draft.

\#\#\# 11.3 Optimistic UX  
\- ✅ Create/update feels instant on slow connections.  
\- ✅ UI shows syncing/pending state.  
\- ✅ Errors show retry path, not silent failure.

\#\#\# 11.4 UX Indicators  
\- ✅ Offline banner appears when offline.  
\- ✅ Draft/sync badge visible on form pages.  
\- ✅ Bilingual parity (EN/FR-CA) for all indicator strings.

\---

\#\# 12\. Testing Plan (MVP1)

\#\#\# 12.1 Manual QA сценарии  
1\. Turn on airplane mode → open Create Client form → type fields → refresh → data persists.  
2\. Save while offline → see “Saved on device” state.  
3\. Restore connection → draft becomes “Ready to submit”.  
4\. Submit online → record created → badge becomes “Synced”.  
5\. Introduce mutation error (bad RLS) → rollback & error badge.

\#\#\# 12.2 Automation (Recommended)  
\- Playwright test:  
  \- emulate offline  
  \- type into inputs  
  \- reload  
  \- assert persisted values  
\- React Query mutation tests:  
  \- optimistic updates \+ rollback behavior

\---

\#\# 13\. Implementation Notes (Guardrails)

\#\#\# 13.1 No PII Logging  
\- No console logs containing user inputs, emails, addresses.  
\- If debug is needed, use redacted logging helpers.

\#\#\# 13.2 Security Note (Local Storage)  
Draft data stored on device is accessible to anyone with device access.  
MVP1 mitigation:  
\- avoid storing forbidden fields  
\- avoid storing payment data  
\- keep drafts minimal and purpose-bound

Future hardening (MVP2+):  
\- optional encryption at rest for drafts  
\- user-controlled “Clear local data” button

\#\#\# 13.3 Local Data Cleanup on Logout (MANDATORY)

On user logout:  
\- All IndexedDB draft stores MUST be cleared.  
\- Any persisted draft data MUST be destroyed.

Rationale:  
\- Prevents data leakage on shared devices.  
\- Aligns with Law 25 / PIPEDA data minimization.  
\- IndexedDB data is stored in plain text.

Logout is not complete until local draft storage is cleared.  
\---

\#\# 14\. Next Specs That Must Follow This  
All future specs must:  
\- use repositories  
\- add persistent drafts for multi-field entry  
\- define sync/draft UX states for their flow

\*\*Immediate next:\*\* SPEC-003 (Jobs) must adopt:  
\- \`usePersistentForm\` for Create Job flow  
\- optimistic mutation patterns via React Query  
\- SyncBadge indicators on Job form and list items

\---

\*\*End of SPEC-000\*\*  
