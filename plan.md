# Plan: Implement Admin Portal

## 1. Database & Security
* Create a migration `20260312000000_admin_portal.sql` to define an RPC function `get_admin_metrics()` that retrieves total active users, total jobs, and active jobs.
* To make it secure, ensure the RPC checks if the current user has `role = 'admin'` in their profile. If not, it should raise an exception or return empty. Wait, the RPC runs with invoker privileges, so we can do a check: `IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN RAISE EXCEPTION 'Unauthorized'; END IF;`
* Update `src/types/database.types.ts` to include `get_admin_metrics`.

## 2. Admin Portal Frontend
* Create `src/pages/admin/AdminDashboardPage.tsx`. It will display the metrics fetched from the `get_admin_metrics` RPC in simple, desktop-optimized cards.
* Include basic error handling and a loading state.

## 3. Routing & Access Control
* Update `src/App.tsx` to include an `/admin` route. We will wrap it in `ProtectedRoute`.
* We should add an `AdminRoute` wrapper or just do a simple check inside `AdminDashboardPage.tsx` to redirect if the user's role is not `admin`. Let's update `useAuth` or use the profile data. Wait, does `useAuth` expose profile data? Let's check `src/lib/auth.tsx`.

## 4. Tests
* Write unit tests for `AdminDashboardPage` in `src/pages/admin/AdminDashboardPage.test.tsx` to verify that it loads and displays metrics.

## 5. Pre-commit & Submit
* Run tests, lints, and type checks.
* Mark bead as closed.
