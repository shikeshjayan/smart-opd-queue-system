import type {
  DoctorProfile,
  Encounter,
  OPD,
  OPDCounts,
  PatientSummary,
  QueueEntry,
} from "@/types";

export type DoctorDashboard = {
  doctor: DoctorProfile;
  opd: OPD;
  counts: OPDCounts;
  current: {
    entry: QueueEntry;
    patient: PatientSummary | null;
    encounterId: string;
  } | null;
  waitingPreview: QueueEntry[];
};

export type ConsultationContext = {
  encounter: Encounter;
  patient: PatientSummary | null;
  doctor: DoctorProfile;
};
