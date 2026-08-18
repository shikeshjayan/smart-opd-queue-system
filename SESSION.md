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
  - `src/services/government/` (service + types), `src/services/permissions/` (placeholder RBAC).
  - `src/features/government-admin/`: contexts, hooks, mock API, and components (GovernmentShell, GovernmentSidebar/Header, LiveIndicator, StatGrid, DistrictCard, HospitalSummary, QueueOverview, AlertList, PerformanceTable, ExportActions).
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
