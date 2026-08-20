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

## Phase 9 — Notifications & Real-Time Queue
- **Realtime feature `src/features/realtime/`**: centralized `QueueEvent` union (`TOKEN_CALLED/STARTED/COMPLETED/SKIPPED/CANCELLED/QUEUE_UPDATED` + `CONNECTION_CHANGED`) in `types/realtime.types.ts`, event constants in `events.ts`, `realtimeClient` singleton (`client.ts`) over a local `EventTarget` bus + `BroadcastChannel("smart-health-queue")` so separate browser tabs (patient / doctor / display) stay synchronized; `useRealtime` hook; dev-only `simulator.ts` auto-advances a queue through call→start→complete (respects configurable grace period → auto-skip) and drives events through the same `queueMockApi` mutations.
- **Queue engine**: `queueMockApi` mutations now emit realtime events after the service accepts them (frontend never mutates queue state directly); `getSnapshot` computes live `nowServing`/`patientsAhead` from the queue and adaptive `estimatedWaitMinutes` via `features/queue/utils/waiting-time.ts` (recent-consultation-duration buffer in `services/queue`); snapshot gains `departmentName/doctorName/room/fetchedAt`. `QueueEntry` gained optional `isPriority`. Config in `features/queue/config.ts` (`NEAR_TURN_AHEAD=3`, `GRACE_PERIOD_MINUTES=5`, `AVG_CONSULTATION_MINUTES=5`).
- **Patient queue `/patient/queue`** rebuilt around `useQueueRealtime`: status-driven phases (`waiting/near_turn/called/in_consultation/completed/skipped/cancelled/no_show/expired`; near_turn is derived from patientsAhead ≤ 3, not persisted), `WaitingView/NearTurnView/CalledView/ConsultationView/CompletedView/TokenEndedView`, `ConnectionStatus` + offline banner with last-updated time, "I've Arrived" acknowledge on called.
- **Doctor queue `/doctor/queue`**: realtime refetch + `ConnectionStatus`, new **Complete Consultation** on `CurrentToken` when `in_consultation`, dev-only auto-advance + simulate-disconnect toggles, "Open display" link. Priority "P" chip on staff queue items.
- **Reception live queue `/reception/queue`**: OPD selector + read-only live current/waiting via `useDoctorQueueRealtime`; nav "Live Queue" + dashboard quick action.
- **Hospital display `/display/[opdId]`**: standalone (no RoleGuard), token-numbers-only (no patient names), now-serving + up-next chips, `AudioAnnouncementPanel` + `useAnnouncement` (Web Speech, enable/volume/language en/ml persisted to localStorage).
- **Notifications feature `src/features/notifications/`**: types (`NotificationType`, `QueueNotification` w/ priority, `NotificationPreferences` w/ channels), localStorage-backed mock API (seeded, dedupe by id), `useNotifications` (auto-adds critical `TOKEN_CALLED` notification for the patient's active token, respects in-app prefs), `NotificationBell` in patient header (live unread badge + dropdown), `NotificationList/Item`, `NotificationPreferences` (in-app toggle rows; SMS/push shown "Not available"). Notification center `/patient/notifications` with All/Unread/Preferences tabs + category filter; profile Preferences links to it. Levels: critical=called, important=near-turn (fired by queue page on phase transition), silent=position-only.
- **Demo data coherence**: A-039 in_consultation now Anu M (P10421) — the demo patient P10294/Rahul K has one clean waiting token A-047 (patientsAhead 7); registration seed + patient pool (`services/patient`) populated so doctor/consultation resolve real patients.
- Realtime is an update channel, not source of truth — every event triggers a snapshot refetch (never client-side state patch).

## Phase 10 — Emergency, Priority & Special Queue Management
- **Priority model**: `QueuePriority = "normal" | "priority" | "emergency"` on `QueueEntry` (replaces Phase 9 `isPriority`), plus `overrideAhead?: boolean` and `position?`. `OPDStatus` gained `"paused"` + optional `statusReason`/`statusUpdatedAt`.
- **Permissions**: added `ASSESS_PRIORITY` (clinical_staff, hospital_admin), `REQUEST_OVERRIDE` (receptionist, clinical_staff, hospital_admin), `APPROVE_OVERRIDE` (hospital_admin), `VIEW_PRIORITY_AUDIT` (hospital_admin), `REQUEST_ASSISTANCE` (patient), `MANAGE_ASSISTANCE` (clinical_staff, hospital_admin). Receptionist can request overrides but never assign priority or approve.
- **Authoritative engine** (`services/queue`): `orderWaiting` sorts by `overrideAhead → emergency → priority → normal → token sequence`; `callNext`/`getDoctorQueue`/`getSnapshot` all use it; `patientsAhead`/`position` come from the engine, never client-side sort.
- **Priority feature** `src/features/priority/`: types, localStorage-persisted mock API (`PriorityAssessment`, `AssistanceRequest`, `QueueOverrideRequest`, `PriorityAuditEntry`), hooks. `assignPriority` updates engine + audit + emits `PRIORITY_CHANGED`; override approve applies `overrideAhead` + audit + `QUEUE_UPDATED`. Components: `PriorityBadge` (text+icon+color, not color-only), `PriorityAssessment`, `PriorityHistory`, `QueuePriorityNotice`, `AssistanceRequestDialog`, `AssistanceQueue`, `OverrideRequestDialog`, `OverrideApprovalList`.
- **Clinical workspace** `/clinical/*` (replaces `/workspace-pending` for clinical_staff; `roleHome` updated): `/clinical/priority` (assessment list + dialog, `ASSESS_PRIORITY`-gated), `/clinical/assistance` (staff request queue), `/clinical/history` (audit behind `VIEW_PRIORITY_AUDIT`).
- **Doctor queue**: waiting grouped into Emergency/Priority/Normal sections, priority counts, "N priority patients waiting" alert, `PriorityBadge` on items/current token.
- **Patient transparency**: "Queue order may change…" notice in waiting view; transient "Queue updated — priority case handled" when `patientsAhead` increases; **Request Assistance** button/dialog.
- **Reception**: tokens page gains "Request Override" (dialog + reason, `REQUEST_OVERRIDE`); live queue page shows `PriorityBadge`.
- **Admin**: `/hospital-admin/queue-overrides` approval page (Approve/Reject + audit); OPD detail gains **Pause/Resume** (reason shown to patients) + `QueueStatusBanner`; `OpdStatusBadge` supports paused.
- **`QueueStatusBanner`** (`normal/paused/closed/delayed` via `queueOperationalState`) wired into patient, doctor, reception, display, and admin OPD detail; registration issuance guard blocks tokens while paused.
- **Demo data**: opd_001 seeded with A-041 priority, A-043 emergency, A-046 priority.
- Frontend displays/requests only; the mock engine owns ordering, priority, overrides, and audit.

## Phase 11 — Medical Consultation & Longitudinal Patient History
- **Encounter normalization (M1)**: `@/types.Encounter` is now a relationship layer — `EncounterStatus = "open" | "in_progress" | "completed" | "cancelled"`, plus `hospitalId`, `departmentId`, `tokenId?`, `startedAt?`, `completedAt?`. Clinical text fields (chiefComplaint/symptoms/observations/assessment/plan) were REMOVED from the shared Encounter; clinical content now lives in `services/consultation` (`ConsultationRecord` keyed by encounterId). `mockEncounters` migrated (denormalized display names retained), `createEncounterForToken` builds relationship fields with `status:"open"`. `services/encounter`/`services/doctor` consumers updated; `encounterStatusLabel`/`EncounterStatusBadge` in `features/encounter`.
- **Consultation domain (M2/M4)**: new self-contained `services/consultation` (seed record for the live in-progress encounter E20260819003 / Anu M P10421; localStorage-backed draft persistence) + `features/consultation` (types, `consultation.mock.ts` API, `useConsultation*` hooks). Auto-save draft (debounced 2s, "Saving… / Saved N seconds ago"), checklist-gated completion dialog, success screen (Encounter ID + View Summary / Next Patient), completed-record protection (`CompletedRecordView` + `RequestCorrectionDialog` audit stub).
- **Doctor workspace (M3)**: `/doctor/patients/[patientId]` rebuilt as a tabbed workspace — Overview | History | Consultation | Documents — with sticky `PatientHeader`, split-pane Consultation tab (left PatientSummary + medications, right form), deep-link routes `/history` and `/consultation`. Old `/doctor/consultation/[encounterId]` redirects to the workspace.
- **Medicine & prescription (M5)**: `services/medicine` catalog (~27 OPD meds with generic + brand names, strengths, frequencies, max-dose metadata, allergy groups, interaction pairs) + `services/prescription` (structured prescriptions, medication-regimen store for active/discontinued tracking). `features/medicine` (MedicineSearch, DosageField with daily-max-dose validation UX, MedicationSafetyWarnings, MedicationSafetyNotice) and `features/prescription` (PrescriptionComposer, ActiveMedicationList with discontinue flow, PrescriptionHistory, printable prescription via window.print).
- **Pharmacy foundation (M6)**: `features/pharmacy` (PharmacyQueueEntry model, mock API deriving queue from prescriptions, dispatch/dispense actions + activity audit). Doctor-side "Send to pharmacy" handoff on completion + prescription history.
- **Permissions**: added `PRESCRIBE_MEDICATION`, `REQUEST_CORRECTION` (doctor), `VIEW_PHARMACY_QUEUE` (doctor, hospital_admin).
- Note: patient-facing history/prescriptions pages remain on the Phase-6 `medical-records` model; new structured prescriptions surface in the doctor workspace (active meds / prescription history / pharmacy handoff).

## Phase 12 — Prescription & Medication Management
- **Prescription workflow (P1–P4)**: dedicated screen `/doctor/patients/[patientId]/prescription` + new **Prescription** tab in the patient workspace (Overview|History|Consultation|Prescription|Documents). `services/prescription` gained `workflowStatus: draft|finalized|cancelled` on `Prescription` (separate from the dispensing `status` axis), `createdAt`/`finalizedAt`/`doctorId`/`hospitalId`, and draft lifecycle methods `createDraft/updateDraft/finalize/cancel/getDraftForEncounter` (localStorage-persisted; `create` is now createDraft+finalize and consultation completion reuses it). New `features/prescription/hooks/usePrescription.ts` (`usePrescriptionWorkflow`: draft load, debounced autosave "Saved at HH:MM", finalize, cancel, `requestCorrection`).
- **Structured items (P3/P5–11)**: `PrescriptionItem` model evolved in place — `duration: {value, unit: days|weeks|months}` (via `durationToDays`/`formatDuration`), `medicineName` snapshot, `route` decoupled from `instructions`, catalog metadata (generic/brand/form/strength) resolved from `services/medicine`. New doctor-built field components: `FrequencyField` (presets + custom), `RouteField` (controlled Oral→Inhaled + custom), `DurationField` (value+unit), `DosageField` rebuilt as strength select + custom; `MedicineItem` composes them + per-item instructions + max-dose/package notes. `PrescriptionComposer` (consultation) now uses the same item model/components.
- **Form → Review → Finalize (P17/18)**: `PrescriptionForm` (MedicineSearch, item rows, safety recap, existing-medication warnings `utils/existing-medication.ts`, global instructions, Save Draft / Review Prescription) → `PrescriptionReview` (read-only itemized dosage/frequency/route/duration/instructions, safety recap, Back to Edit / Finalize, gated by `utils/prescription-validation.ts`) → finalized screen (✓ + Prescription ID + View/Print). Finalized prescriptions are read-only; edits go through **Request Correction** (cancels + creates a correction draft) instead of direct editing.
- **Medication feature** `src/features/medication/`: `AllergyWarning` (prominent ⚠ banner + potential-conflict notice), `ActiveMedicationCard`, `MedicationList` (Current Medications + history link), `MedicationHistory` (timeline grouped by date with Active/Completed/Discontinued/All filters); regimen status extended to `active|completed|discontinued` (completed auto-derived from duration end). Wired into patient dashboard (Current Medications + allergy banner + "View Medication History").
- **Patient view (P20)**: `/patient/prescriptions` (list) + `/[prescriptionId]` (detail) migrated from the Phase-6 `medical-records` model to `prescriptionService` — structured dosage/frequency/route/duration/instructions + status + Print via `PrescribedMedicineView`. Read-only; `RecordAccessNotice audience="patient"`.
- **Pharmacy boundary (P21/22)**: pharmacy queue only shows `workflowStatus==="finalized"` reservations; doctor never marks dispensing. `PrescriptionStatus` badge renders the two axes (workflow + dispensing). Printable prescription (`utils/print.ts`) includes duration/route/`medicineName`/Prescription ID + governed-signature note.
- **RBAC (P23)**: screen actions gated on `PRESCRIBE_MEDICATION`, Request Correction on `REQUEST_CORRECTION`, patient reads via `VIEW_OWN_MEDICAL_HISTORY`. Client gating is UX only — backend re-authorization required (noted).
- Verify: `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean; new route returns through the protected-auth redirect chain like other doctor routes.

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
