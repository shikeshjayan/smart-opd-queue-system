# SESSION.md — Smart Health OPD

Resumable session notes for the Smart Health OPD hospital token system.

## Stack
- Next.js 16.3.1, React 19.2.8, Tailwind CSS v4 (PostCSS), TypeScript 5.
- **No real backend** — all data is frontend mock data in `src/services/data.ts` with ~300ms `delay()`.
- Path alias: `@/*` → `src/*`.

## What's built
- Patient portal (`/patient/*`): hospitals → departments → OPDs → token → queue tracking.
- Doctor workspace (`/doctor/*`): dashboard, queue, OPD, patients, consultation (encounters), history, profile.
- Hospital admin (`/hospital-admin/*`): dashboard, departments, doctors, OPDs, queues, patients, staff, notifications, reports, settings.
- **Phase 5 — State & District Administration** (`/district-admin/*`, `/state-admin/*`): government workspaces over the Kerala hierarchy (State → 14 Districts → Hospitals → Departments → OPDs → Queues).
  - `src/config/kerala.ts` re-exports `keralaDistricts` (canonical source: `src/config/districts.ts`), `getDistrictById`, `listDistricts`.
  - `src/services/government/` (service + types) and `src/features/government-admin/`: contexts, hooks, mock API, and components (GovernmentShell, GovernmentSidebar/Header, LiveIndicator, StatGrid, DistrictCard, HospitalSummary, QueueOverview, AlertList, PerformanceTable, ExportActions). (Legacy placeholder `src/services/permissions/` removed in Phase 7 — superseded by `src/features/auth/permissions.ts`.)
  - `src/components/date-range-filter.tsx` (reusable).
  - Demo district admin is **hardcoded to Ernakulam** via `DISTRICT_ADMIN_DISTRICT_ID = "ernakulam"` in `src/config/app.ts`. Ernakulam has full drill-down; other districts are read-only.
  - Profiles: `DISTRICT_ADMIN` (dadm_001, K. P. Vishwanath), `STATE_ADMIN` (sadm_001, Dr. A. Radhakrishnan) in `data.ts`.
- **Phase 6 — Patient Medical Records & Health History**:
  - `DEMO_PATIENT_ID` repointed to **P10294 / Rahul K** (`src/config/app.ts`). Fixed duplicate encounter id `E20260815001` → `E20260815002` in `data.ts`; queue label "Rahul K"; `patientService` persona aligned.
  - New self-contained module `src/services/medical-records/` (seed data + `delay()` service): encounters across GH Ernakulam / GH Aluva / GH Perumbavoor, plus linked diagnoses, prescriptions, lab reports, allergies, conditions, medications, documents, and patient profile.
  - New feature `src/features/medical-records/`: types (`types/medical-record.types.ts`), mock API, hooks (`useMedicalRecords.ts`), components (MedicalSummary, MedicalTimeline, EncounterCard, EncounterDetailView, Allergy/Condition/Medication/Prescription/LabReport/Document cards, RecordAccessNotice, HistoryFilters, Pagination), utils/format.
  - Patient routes: `/patient/history` (tabs Overview/Timeline/Visits + filters + pagination), `/patient/history/encounters/[encounterId]`, `/patient/prescriptions` + `/[prescriptionId]`, `/patient/lab-reports` + `/[reportId]`, `/patient/documents`, `/patient/profile` (personal/contact/emergency/clinical/preferences).
  - Doctor routes: `/doctor/patients/[patientId]` rebuilt clinical-first (Important Information + recent + full history), new `/doctor/patients/[patientId]/encounters/[encounterId]` chronicle, clinical snapshot strip added to `/doctor/consultation/[encounterId]`.
  - Role-aware foundation via `RecordAccessNotice` (patient/doctor audiences); real RBAC deferred to Phase 7.
- **Phase 7 — Authentication, Identity & Role-Based Access**:
  - Auth feature `src/features/auth/`: types (`types/auth.types.ts`: UserRole/SessionUser/UserScope/AuthState), `roles.ts` (labels, roleHome, destinationFor), `permissions.ts` (Permission union + role→permission matrix), `guards.ts`, hooks (`hooks/useAuth.tsx`: AuthProvider mounted in root `app/layout.tsx`, `useAuth`, `usePermissions` → `can()`), mock API, components (AuthShell, AuthLoading, LoginChooser, PatientLoginForm, StaffLoginForm, OTPForm, RoleGuard, ProtectedRoute, PermissionGuard, SessionExpired, LogoutButton, SessionBadge, ScopeBreadcrumbs).
  - Mock auth rewritten in `src/services/auth/` — 7 demo accounts for every role (P10294 patient, doc_001 doctor, stf_001 receptionist, stf_002 clinical_staff, adm_001 hospital_admin, dadm_001 district_admin, sadm_001 state_admin), real scopes, `localStorage` persistence + 8h `expiresAt`, demo OTP `123456`.
  - Auth pages under `(auth)`: `/login` (chooser + demo quick-select), `/patient-login` (OTP flow), `/staff-login` (staff ID + password), wired `/verify`, usable `/forgot`, `/unauthorized` page, plus public `/workspace-pending` (reception/nurse Phase 8 notice).
  - **Route protection**: `RoleGuard` wraps all five workspace layouts (`patient`/`doctor`/`hospital-admin`/`district-admin`/`state-admin`); loading → AuthLoading, unauthenticated → `/login?next=…`, wrong role → `/unauthorized`; doctor layout uses `expiredMode="inline"` (SessionExpired overlay preserves in-progress consultation data).
  - Session-driven contexts: HospitalAdminProvider (identity from session, hospital scope restricts switcher to authorized hospitals), District/State providers derive admin from session (no self-fetch). Headers (Patient/Doctor/Admin/Government) gained `SessionBadge` + `LogoutButton`; `ScopeBreadcrumbs` rendered in admin/government shells (Kerala → District → Hospital → Department).
  - Permission-aware UI: government `ExportActions` gated on `VIEW_REPORTS` + `EXPORT_REPORTS`; doctor consultation Save/Complete gated on `EDIT_ENCOUNTER`/`COMPLETE_ENCOUNTER`; hospital settings Save gated on `MANAGE_HOSPITAL`.
  - Note: legacy `src/services/auth` login/register/me removed (unused); `src/services/permissions/` deleted (unused placeholder). Client-side enforcement only — server/middleware authorization deferred to backend phases.
- **Phase 8 — Reception, Registration & Token Desk**:
  - `roleHome("receptionist")` now → `/reception/dashboard`; new `/reception/*` group gated by `RoleGuard roles={["receptionist"]}` (no clinical-history permission).
  - New `src/services/registration/` (self-contained mock): search across registered hospitals, duplicate-detection heuristic, new-patient creation with read-only `P{yyyyMMdd}{seq}` ID, enriched OPD availability (Available/Almost Full/Full/Closed + capacity bar), **service-side token generation** (frontend never computes the number), cancel-by-reason and reissue-with-linkback, registration history + pagination, walk-in vs appointment.
  - `data.ts` gained `registerQueueEntry` (tokens generated at reception flow into the doctor's queue) and `setQueueEntryStatus` now also scans generated queues; new patients pushed into shared `mockPatients` (visible to hospital-admin/doctor workspaces).
  - New features: `src/features/registration/` (RegistrationWizard 5-step, PatientSearch debounced, NewPatientForm, ExistingPatientCard, DuplicateWarning, OPDSelector, RegistrationSummary, TokenSuccess, ReceptionHeader, ReceptionContext, `useRegistration.ts`, `useKeyboardShortcuts`) and `src/features/token/` (TokenStatus, TokenCard, TokenList, TokenSummary, CancelTokenDialog, real `printToken` via a new window + window.print).
  - Routes: `/reception/dashboard` (stats, quick actions, recent registrations), `/reception/registration`, `/reception/patients` + `/[patientId]` (registration view — clinical info intentionally absent), `/reception/tokens` (filters, cancel/reissue dialogs, print), `/reception/history` (filters + pagination).
  - Keyboard-friendly (Ctrl+K → find patient, F2 → new registration); desktop-first, degrades on mobile.
  - Emergency/priority triage deferred to Phase 10; identity/duplicate engine + backend atomicity deferred to backend phases.

## Recent change: radius tokens → 4px
- `src/app/globals.css` `@theme` block:
  - `--radius-btn: 0.25rem` (was 0.5rem)
  - `--radius-card: 0.25rem` (was 1rem)
  - `--radius-token: 0.25rem` (was 0.75rem)
- Decision: **4px everywhere (0.25rem)**, uniform. `rounded-full` (pills/badges/dots/token circle) intentionally kept round — do not flatten without asking.
- All radius usage flows through these three tokens (`rounded-btn`/`rounded-card`/`rounded-token`); no component files reference raw radius values.

## Conventions
- Client pages + `useAsync` (`src/lib/use-async.ts`); `Skeleton`/`ErrorState`/`EmptyState`.
- Responsive tables: desktop `Table` in `hidden md:block` + mobile card list `md:hidden`.
- Reused components: `PageHeader`, `Badge`, `Card`, `Select`, `Tabs`, `Button`, `Input` (`src/components/ui/*`), `HealthBadge`, `OpdStatusBadge`, `getGreeting`.
- No comments in code unless asked.

## Verify commands (run from repo root)
1. `npx tsc --noEmit`
2. `npm run lint` (eslint)
3. `npm run build` (next build)
4. `node node_modules/next/dist/bin/next start -p <port>` then curl each route for 200.
   - Note: on Windows use `taskkill //F //PID <pid>` (find pid via `netstat -ano | grep :<port>`) to stop the server; `pkill` won't work.

## Git state
- Branch `main`, clean tree. All current work committed in `6733b0a feat: scaffold role-based Hospital OPD token system`.

## Next steps / open ideas
- Wire real permissions (currently placeholder; used only to disable export buttons).
- Wire actual backend/API (`src/services/api/*` endpoints exist but mock data is used).
- Consider a dedicated state-level hospital drill-down route (currently only district admin has per-hospital detail).
