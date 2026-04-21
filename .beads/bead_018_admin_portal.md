# Bead: Initialize Admin Portal
**Bead ID:** bead_018
**Status:** Open

## Context
Per MVP1 MASTER PRD section 16, milestone "10. Admin Portal (read-only)" is next.
This is a desktop-optimized admin portal for the platform operator, protected by an `admin` role.

## Scope
- Scaffold an `AdminPortalPage.tsx` route under `/admin`.
- Ensure it is strictly role-gated (read-only views only).
- It will eventually use an admin RPC endpoint like `get_admin_metrics`.

## Next Steps
- Verify routing protection.
- Implement read-only UI stub.
