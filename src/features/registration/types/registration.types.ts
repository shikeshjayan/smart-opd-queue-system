export type RegistrationType = "walk_in" | "appointment";

export type RegistrationRecord = {
  id: string;
  patientId: string;
  patientName: string;
  isNewPatient: boolean;
  hospitalId: string;
  departmentId: string;
  departmentName: string;
  opdId: string;
  opdName: string;
  tokenNumber: string;
  registrationType: RegistrationType;
  appointmentId?: string;
  createdAt: string;
  status: "active" | "cancelled";
  cancelledReason?: string;
  cancelledAt?: string;
  reissuedTokenNumber?: string;
};

export type OPDTokenStatus =
  | "waiting"
  | "called"
  | "in_consultation"
  | "completed"
  | "skipped"
  | "cancelled"
  | "no_show";

export type OPDToken = {
  id: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  departmentId: string;
  departmentName: string;
  opdId: string;
  opdName: string;
  status: OPDTokenStatus;
  registrationType: RegistrationType;
  createdAt: string;
  cancelReason?: string;
  reissuedFrom?: string;
  reissuedTo?: string;
};

export type RegistrationStats = {
  total: number;
  newPatients: number;
  existingPatients: number;
  tokensGenerated: number;
  cancelled: number;
  waiting: number;
};

export type PatientSearchResult = {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  phone: string;
  bloodGroup?: string;
  lastVisit?: string;
};

export type PotentialDuplicate = {
  id: string;
  name: string;
  age: number;
  mobileLast4: string;
};

export type NewPatientInput = {
  name: string;
  dateOfBirth?: string;
  gender: "male" | "female" | "other";
  mobile: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
};

export type OPDAvailabilityStatus =
  | "available"
  | "almost_full"
  | "full"
  | "not_started"
  | "closed"
  | "doctor_unavailable";

export type OPDRegistration = {
  opdId: string;
  opdName: string;
  startTime: string;
  endTime: string;
  departmentId: string;
  departmentName: string;
  doctorName: string;
  queueCount: number;
  capacity: number;
  generated: number;
  availability: OPDAvailabilityStatus;
  estimatedWaitMinutes: number | null;
};

export type TokenCancelReason =
  | "patient_requested"
  | "duplicate_token"
  | "wrong_opd"
  | "opd_closed"
  | "technical_issue"
  | "other";

export type RegistrationFilters = {
  departmentId?: string;
  opdId?: string;
  type?: RegistrationType;
  date?: string;
};

export type TokenFilters = {
  departmentId?: string;
  opdId?: string;
  status?: OPDTokenStatus;
  query?: string;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type RegistrationState = {
  step: 1 | 2 | 3 | 4 | 5;
  patientType: "new" | "existing";
  patientId?: string;
  patientName?: string;
  newPatientInput?: NewPatientInput;
  departmentId?: string;
  opdId?: string;
  registrationType: RegistrationType;
  appointmentId?: string;
  result?: {
    token: OPDToken;
    record: RegistrationRecord;
  };
  error?: string | null;
  busy: boolean;
};