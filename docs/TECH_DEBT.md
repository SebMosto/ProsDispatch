# Tech Debt

This file tracks deferred features, known limitations, and post-pilot improvements.

---

## Open Items

### TD-001 — Google Places Autocomplete on Address Fields

| Field       | Value |
|-------------|-------|
| **Area**    | Address inputs (clients, properties) |
| **Status**  | Deferred — post-pilot |
| **Logged**  | 2026-03-18 |

**Description:**
Integrate the Google Places Autocomplete API on all address fields to improve data quality and reduce manual entry errors for contractors adding clients and properties.

**Requirements to unblock:**
- Google Cloud project with the **Places API** (New) enabled
- API key restricted to the production domain
- Billing account active on the Google Cloud project (Places API is not free-tier)

**Suggested implementation notes:**
- Use `@react-google-maps/api` or the official `@googlemaps/js-api-loader` package
- Wrap the autocomplete widget in a controlled component that populates the existing `street`, `city`, `province`, and `postal_code` fields from the Places result
- Gate behind `VITE_GOOGLE_MAPS_KEY` env var; fall back to plain text input when the key is absent
- Add the env var to `.env.example` and the CI secrets checklist

**Acceptance criteria (when resumed):**
- [ ] Typing in an address field shows a dropdown of Place suggestions
- [ ] Selecting a suggestion auto-fills street, city, province/state, and postal code
- [ ] Falls back gracefully to manual text input if the API key is missing or the request fails
- [ ] No inline styles; Tailwind only
- [ ] EN/FR i18n keys added for any new user-facing strings
- [ ] Unit tests cover the fallback path

---
