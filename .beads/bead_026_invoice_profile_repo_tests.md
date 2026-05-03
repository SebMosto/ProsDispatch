# Bead: Missing repository tests — invoiceRepository + profileRepository

**Bead ID:** bead_026
**Status:** open
**Type:** test coverage (TDD-after-the-fact)
**Depends on:** none
**ROLES:** Mayor=claude.ai Cowork (Seb), Polecat=Cursor or Claude Code Terminal, Auditor=Gemini + Codex PR review + Stop Hook
**Created:** 2026-04-29

---

## Context

Pre-marketing audit (claude.ai Cowork, 2026-04-29) confirmed test coverage gaps in two repositories:

- `src/repositories/invoiceRepository.ts` — no test file
- `src/repositories/profileRepository.ts` — no test file

The other four repositories (`base`, `client`, `job`, `property`) all have test files. CI enforces 80% coverage per `CLAUDE.md`; today's pass is incidental — the next PR that touches `src/` could tip total coverage below threshold and start failing builds without warning.

These two repositories are also the ones that touch your money flow (`invoiceRepository`) and your contractor's PII (`profileRepository`). They should have explicit test coverage before pilot customers arrive, independent of the threshold concern.

This is **TDD-after-the-fact** — the implementations exist and ship; the tests are being added retroactively. Use the existing test files (`clientRepository.test.ts`, `propertyRepository.test.ts`, `jobRepository.test.ts`, `base.test.ts`) as the canonical pattern. Match their style, structure, and mocking approach. Do NOT introduce a new test pattern.

---

## Scope (file allowlist — no edits outside this list)

**New files:**
- `src/repositories/invoiceRepository.test.ts`
- `src/repositories/profileRepository.test.ts`

**No edits expected:**
- `src/repositories/invoiceRepository.ts` — implementation must not change to make tests pass
- `src/repositories/profileRepository.ts` — same
- Any other file in the repo

---

## Test coverage requirements — `invoiceRepository.test.ts`

Tests must cover the following methods (refer to `invoiceRepository.ts` for exact signatures):

1. **`createDraft`** (or equivalent draft-creation path)
   - Successful create returns `data` with generated invoice number (`INV-XXXXXXXX` pattern)
   - Insert error returns `RepositoryError` with `reason: 'server'`
   - Network failure returns `RepositoryError` with `reason: 'network'`
   - Items array is persisted via `replaceInvoiceItems`

2. **`update`**
   - Successful update returns updated record with items
   - Validation error path

3. **`finalize`** (or equivalent — confirm method name during Audit)
   - Status transition draft → finalized
   - Token generation if applicable

4. **`void`**
   - Status transition to void
   - Records voided_at timestamp

5. **`listByContractor`**
   - Returns array filtered by contractor_id
   - Empty result returns `data: []`, no error

6. **`listByClient`**
   - Returns array filtered by client_id

7. **`getByToken`** or **public token fetch path** (verify exact name during Audit)
   - Valid token returns invoice
   - Invalid token returns null with appropriate error
   - Note: this may go via RPC, not direct table access — match the implementation

8. **`replaceInvoiceItems` (private — test via public methods that call it)**
   - Empty items array deletes existing rows and inserts nothing
   - Non-empty replaces wholesale

9. **Error handling consistency**
   - `RepositoryError` shape matches base contract (`message`, `reason`, optional `status`, optional `cause`)

---

## Test coverage requirements — `profileRepository.test.ts`

Tests must cover:

1. **`get`**
   - Returns `{ full_name, business_name }` for valid user id
   - Error path returns `RepositoryError`

2. **`getStripeConnect`**
   - Returns `{ stripe_connect_id, stripe_connect_onboarded }`
   - Error path

3. **`update`**
   - Successful update returns updated profile data
   - Partial update preserves untouched fields
   - Validation error path

4. **Network online/offline reporting**
   - `reportApiOnline()` is called on success
   - Error states do not falsely report online

---

## Mocking approach

- Match the existing pattern in `clientRepository.test.ts` and `propertyRepository.test.ts` exactly. Read those before writing.
- Mock `@supabase/supabase-js` client at module level via `vi.mock`
- Construct repository instance with the mocked client (the repos accept a client in their constructor — see `BaseRepository.constructor`)
- Do NOT mock `BaseRepository.toRepositoryError` directly; let it execute against fake Postgres errors so error-shape tests are real

---

## Acceptance criteria

- [ ] Both new test files exist following the pattern in `clientRepository.test.ts`
- [ ] All `invoiceRepository` public methods have at least one happy-path and one error-path test
- [ ] All `profileRepository` public methods have at least one happy-path and one error-path test
- [ ] Tests pass in isolation: `npm run test src/repositories/invoiceRepository.test.ts`
- [ ] Tests pass in isolation: `npm run test src/repositories/profileRepository.test.ts`
- [ ] Full test suite still passes (no regression in existing tests): `npm run test`
- [ ] Total coverage maintained above 80%: `npm run test -- --coverage` (run as a verification step, not committed)
- [ ] No mocking pattern divergence — both new files use the same mock setup as the existing repo tests
- [ ] No implementation changes to `invoiceRepository.ts` or `profileRepository.ts` (verify via `git diff` showing only new test files)
- [ ] All Stop Hook checks pass

---

## Stop Hook requirements

Run in order, paste output into `## Run Results — [date]` section at the bottom of this bead file:

1. `npm run typecheck`
2. `npm run build`
3. `npm run lint`
4. `npm run test`
5. `npm run check:i18n`

---

## Notes for the executing Polecat

- The implementation files are **the source of truth**. Read them before writing tests. Do not test behaviour the implementation doesn't have.
- If during Audit you discover a real bug in `invoiceRepository` or `profileRepository`, do NOT fix it inside this bead. File a new bead in your PR description and let the Mayor decide whether to escalate or schedule.
- Match the test names and structure conventions from `clientRepository.test.ts` precisely — the test suite reads as a single document, don't make this one read like a different author wrote it.
- These repos touch payment and PII. Aim for thorough error-path coverage, not just happy paths.

---

## Mayor handoff log

- 2026-04-29: Bead authored by claude.ai Cowork acting as Mayor. Awaits Polecat assignment.
