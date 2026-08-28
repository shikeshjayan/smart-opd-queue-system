import { DEFAULT_HOSPITAL_ID, DISTRICT_ADMIN_DISTRICT_ID } from "@/config/app";

const DEMO_PATIENT_ID = "P10294";
import type {
  AdminNotification,
  AdminProfile,
  AdminSettings,
  Department,
  DistrictAdminProfile,
  DistrictPerformance,
  DoctorProfile,
  DoctorRecord,
  Encounter,
  GovernmentAlert,
  Hospital,
  OPD,
  OPDCounts,
  PatientSummary,
  QueueEntry,
  QueuePriority,
  QueueStatus,
  StaffMember,
  StateAdminProfile,
  Token,
} from "@/types";
import type { DistrictId } from "@/config/districts";

export const mockHospitals: Hospital[] = [
  {
    id: "hos_001",
    code: "GH-ERN-001",
    name: "Government Hospital Ernakulam",
    districtId: "ernakulam",
    address: "MG Road, Ernakulam",
    phone: "+91 484 238 1000",
    opdCount: 12,
    type: "general",
    status: "active",
    capacity: { beds: 500, opds: 12, labs: 3 },
    adminContact: { name: "Dr. Sreeja Nambiar", phone: "+91 98470 90001", email: "admin@gh-ernakulam.gov.in" },
    createdAt: "2024-01-01T00:00:00",
    updatedAt: "2026-08-16T00:00:00",
  },
  {
    id: "hos_002",
    code: "MC-KTM-001",
    name: "Government Medical College Kottayam",
    districtId: "kottayam",
    address: "Gandhi Nagar, Kottayam",
    phone: "+91 481 259 2000",
    opdCount: 8,
    type: "medical_college",
    status: "active",
    capacity: { beds: 800, opds: 8, labs: 5 },
    adminContact: { name: "Dr. Admin Kottayam", phone: "+91 481 259 2001", email: "admin@mckottayam.gov.in" },
    createdAt: "2024-01-01T00:00:00",
    updatedAt: "2026-08-16T00:00:00",
  },
  {
    id: "hos_003",
    code: "DH-TCR-001",
    name: "District Hospital Thrissur",
    districtId: "thrissur",
    address: "Palace Road, Thrissur",
    phone: "+91 487 232 3000",
    opdCount: 6,
    type: "district",
    status: "active",
    capacity: { beds: 350, opds: 6, labs: 2 },
    adminContact: { name: "Dr. Admin Thrissur", phone: "+91 487 232 3001", email: "admin@dhthrissur.gov.in" },
    createdAt: "2024-01-01T00:00:00",
    updatedAt: "2026-08-16T00:00:00",
  },
  {
    id: "hos_004",
    code: "GH-KZK-001",
    name: "Government Hospital Kozhikode",
    districtId: "kozhikode",
    address: "Mananchira, Kozhikode",
    phone: "+91 495 272 4000",
    opdCount: 9,
    type: "general",
    status: "active",
    capacity: { beds: 400, opds: 9, labs: 3 },
    adminContact: { name: "Dr. Admin Kozhikode", phone: "+91 495 272 4001", email: "admin@ghkozhikode.gov.in" },
    createdAt: "2024-01-01T00:00:00",
    updatedAt: "2026-08-16T00:00:00",
  },
  {
    id: "hos_005",
    code: "GH-ALV-001",
    name: "Government Hospital Aluva",
    districtId: "ernakulam",
    address: "Municipal Road, Aluva",
    phone: "+91 484 262 5000",
    opdCount: 6,
    type: "general",
    status: "active",
    capacity: { beds: 200, opds: 6, labs: 2 },
    adminContact: { name: "Dr. Sreeja Nambiar", phone: "+91 98470 90001", email: "admin@ghaluva.gov.in" },
    createdAt: "2024-01-01T00:00:00",
    updatedAt: "2026-08-16T00:00:00",
  },
  {
    id: "hos_006",
    code: "GH-PBV-001",
    name: "Government Hospital Perumbavoor",
    districtId: "ernakulam",
    address: "MC Road, Perumbavoor",
    phone: "+91 484 264 6000",
    opdCount: 3,
    type: "taluk",
    status: "active",
    capacity: { beds: 100, opds: 3, labs: 1 },
    adminContact: { name: "Dr. Admin Perumbavoor", phone: "+91 484 264 6001", email: "admin@ghperumbavoor.gov.in" },
    createdAt: "2024-01-01T00:00:00",
    updatedAt: "2026-08-16T00:00:00",
  },
  {
    id: "hos_007",
    code: "GH-MTP-001",
    name: "Government Hospital Muvattupuzha",
    districtId: "ernakulam",
    address: "Aluva Road, Muvattupuzha",
    phone: "+91 485 283 7000",
    opdCount: 3,
    type: "taluk",
    status: "active",
    capacity: { beds: 80, opds: 3, labs: 1 },
    adminContact: { name: "Dr. Admin Muvattupuzha", phone: "+91 485 283 7001", email: "admin@ghmuvattupuzha.gov.in" },
    createdAt: "2024-01-01T00:00:00",
    updatedAt: "2026-08-16T00:00:00",
  },
];

export const mockDepartments: Department[] = [
  { id: "dep_001", code: "CARD", hospitalId: "hos_001", name: "Cardiology", waitingCount: 18, status: "active" },
  { id: "dep_002", code: "GENMED", hospitalId: "hos_001", name: "General Medicine", waitingCount: 42, status: "active" },
  { id: "dep_003", code: "ORTHO", hospitalId: "hos_001", name: "Orthopedics", waitingCount: 7, status: "active" },
  { id: "dep_004", code: "PED", hospitalId: "hos_001", name: "Pediatrics", waitingCount: 11, status: "active" },
  { id: "dep_005", code: "GENMED", hospitalId: "hos_002", name: "General Medicine", waitingCount: 31, status: "active" },
  { id: "dep_006", code: "DERM", hospitalId: "hos_002", name: "Dermatology", waitingCount: 5, status: "active" },
  { id: "dep_007", code: "GENMED", hospitalId: "hos_003", name: "General Medicine", waitingCount: 24, status: "active" },
  { id: "dep_008", code: "PED", hospitalId: "hos_003", name: "Pediatrics", waitingCount: 9, status: "active" },
  { id: "dep_009", code: "CARD", hospitalId: "hos_004", name: "Cardiology", waitingCount: 13, status: "active" },
  { id: "dep_010", code: "ENT", hospitalId: "hos_004", name: "ENT", waitingCount: 6, status: "active" },
  { id: "dep_011", code: "GENMED", hospitalId: "hos_005", name: "General Medicine", waitingCount: 26, status: "active" },
  { id: "dep_012", code: "PED", hospitalId: "hos_005", name: "Pediatrics", waitingCount: 9, status: "active" },
  { id: "dep_013", code: "DERM", hospitalId: "hos_005", name: "Dermatology", waitingCount: 4, status: "active" },
  { id: "dep_014", code: "GENMED", hospitalId: "hos_006", name: "General Medicine", waitingCount: 19, status: "active" },
  { id: "dep_015", code: "PED", hospitalId: "hos_006", name: "Pediatrics", waitingCount: 6, status: "active" },
  { id: "dep_016", code: "GENMED", hospitalId: "hos_007", name: "General Medicine", waitingCount: 23, status: "active" },
  { id: "dep_017", code: "ORTHO", hospitalId: "hos_007", name: "Orthopedics", waitingCount: 8, status: "active" },
];

export const mockOpds: OPD[] = [
  {
    id: "opd_001",
    departmentId: "dep_001",
    name: "Morning OPD",
    startTime: "09:00",
    endTime: "12:00",
    status: "open",
    currentlyServing: "A-039",
    estimatedWaitMinutes: 35,
  },
  {
    id: "opd_002",
    departmentId: "dep_001",
    name: "Afternoon OPD",
    startTime: "14:00",
    endTime: "17:00",
    status: "closed",
    currentlyServing: null,
    estimatedWaitMinutes: null,
  },
  {
    id: "opd_003",
    departmentId: "dep_001",
    name: "Special Clinic",
    startTime: "10:00",
    endTime: "13:00",
    status: "full",
    currentlyServing: "C-012",
    estimatedWaitMinutes: 60,
  },
  {
    id: "opd_004",
    departmentId: "dep_002",
    name: "Morning OPD",
    startTime: "09:00",
    endTime: "12:00",
    status: "open",
    currentlyServing: "G-102",
    estimatedWaitMinutes: 25,
  },
  {
    id: "opd_005",
    departmentId: "dep_002",
    name: "Afternoon OPD",
    startTime: "14:00",
    endTime: "17:00",
    status: "closed",
    currentlyServing: null,
    estimatedWaitMinutes: null,
  },
  {
    id: "opd_006",
    departmentId: "dep_003",
    name: "Morning OPD",
    startTime: "09:30",
    endTime: "12:30",
    status: "open",
    currentlyServing: "O-033",
    estimatedWaitMinutes: 20,
  },
  {
    id: "opd_007",
    departmentId: "dep_003",
    name: "Afternoon OPD",
    startTime: "14:30",
    endTime: "16:30",
    status: "unavailable",
    currentlyServing: null,
    estimatedWaitMinutes: null,
  },
  {
    id: "opd_008",
    departmentId: "dep_004",
    name: "Morning OPD",
    startTime: "09:00",
    endTime: "12:00",
    status: "open",
    currentlyServing: "P-021",
    estimatedWaitMinutes: 15,
  },
  {
    id: "opd_009",
    departmentId: "dep_005",
    name: "Morning OPD",
    startTime: "09:00",
    endTime: "12:00",
    status: "open",
    currentlyServing: "G-077",
    estimatedWaitMinutes: 30,
  },
  {
    id: "opd_010",
    departmentId: "dep_006",
    name: "Morning OPD",
    startTime: "09:30",
    endTime: "12:30",
    status: "open",
    currentlyServing: "D-004",
    estimatedWaitMinutes: 10,
  },
  {
    id: "opd_011",
    departmentId: "dep_007",
    name: "Morning OPD",
    startTime: "09:00",
    endTime: "12:00",
    status: "open",
    currentlyServing: "G-051",
    estimatedWaitMinutes: 22,
  },
  {
    id: "opd_012",
    departmentId: "dep_008",
    name: "Morning OPD",
    startTime: "09:00",
    endTime: "12:00",
    status: "full",
    currentlyServing: "P-009",
    estimatedWaitMinutes: 40,
  },
  {
    id: "opd_013",
    departmentId: "dep_009",
    name: "Morning OPD",
    startTime: "09:00",
    endTime: "12:00",
    status: "open",
    currentlyServing: "A-015",
    estimatedWaitMinutes: 28,
  },
  {
    id: "opd_014",
    departmentId: "dep_010",
    name: "Morning OPD",
    startTime: "09:30",
    endTime: "12:30",
    status: "open",
    currentlyServing: "E-002",
    estimatedWaitMinutes: 12,
  },
  {
    id: "opd_015",
    departmentId: "dep_011",
    name: "Morning OPD",
    startTime: "09:00",
    endTime: "12:00",
    status: "open",
    currentlyServing: "G-048",
    estimatedWaitMinutes: 30,
  },
  {
    id: "opd_016",
    departmentId: "dep_011",
    name: "Afternoon OPD",
    startTime: "14:00",
    endTime: "17:00",
    status: "closed",
    currentlyServing: null,
    estimatedWaitMinutes: null,
  },
  {
    id: "opd_017",
    departmentId: "dep_012",
    name: "Morning OPD",
    startTime: "09:00",
    endTime: "12:00",
    status: "open",
    currentlyServing: "P-015",
    estimatedWaitMinutes: 12,
  },
  {
    id: "opd_018",
    departmentId: "dep_013",
    name: "Morning OPD",
    startTime: "09:30",
    endTime: "12:30",
    status: "open",
    currentlyServing: "D-008",
    estimatedWaitMinutes: 8,
  },
  {
    id: "opd_019",
    departmentId: "dep_014",
    name: "Morning OPD",
    startTime: "09:00",
    endTime: "12:00",
    status: "open",
    currentlyServing: "G-063",
    estimatedWaitMinutes: 32,
  },
  {
    id: "opd_020",
    departmentId: "dep_015",
    name: "Morning OPD",
    startTime: "09:00",
    endTime: "12:00",
    status: "open",
    currentlyServing: "P-018",
    estimatedWaitMinutes: 14,
  },
  {
    id: "opd_021",
    departmentId: "dep_016",
    name: "Morning OPD",
    startTime: "09:00",
    endTime: "12:00",
    status: "open",
    currentlyServing: "G-087",
    estimatedWaitMinutes: 26,
  },
  {
    id: "opd_022",
    departmentId: "dep_017",
    name: "Morning OPD",
    startTime: "09:30",
    endTime: "12:30",
    status: "open",
    currentlyServing: "O-021",
    estimatedWaitMinutes: 18,
  },
];

export const mockTokens: Token[] = [
  {
    id: "tok_001",
    tokenNumber: "A-047",
    patientId: DEMO_PATIENT_ID,
    opdId: "opd_001",
    status: "waiting",
    patientsAhead: 7,
    estimatedWaitMinutes: 35,
  },
];

export const DOCTOR: DoctorProfile = {
  id: "doc_001",
  name: "Dr. Anil Kumar",
  speciality: "Cardiology",
  hospitalId: "hos_001",
  hospitalName: "Government Hospital Ernakulam",
  departmentId: "dep_001",
  departmentName: "Cardiology",
  opdId: "opd_001",
  opdName: "Morning OPD",
};

export const mockDoctors: DoctorRecord[] = [
  {
    id: "doc_001",
    hospitalId: "hos_001",
    departmentId: "dep_001",
    name: "Dr. Anil Kumar",
    speciality: "Cardiology",
    phone: "+91 98470 11111",
    email: "anil.kumar@gh-ernakulam.gov.in",
    status: "active",
    joinedAt: "2015-03-10",
    opdIds: ["opd_001", "opd_003"],
  },
  {
    id: "doc_002",
    hospitalId: "hos_001",
    departmentId: "dep_002",
    name: "Dr. Geetha Nair",
    speciality: "General Medicine",
    phone: "+91 98470 22222",
    email: "geetha.nair@gh-ernakulam.gov.in",
    status: "active",
    joinedAt: "2018-07-22",
    opdIds: ["opd_004"],
  },
  {
    id: "doc_003",
    hospitalId: "hos_001",
    departmentId: "dep_003",
    name: "Dr. Ramesh Iyer",
    speciality: "Orthopedics",
    phone: "+91 98470 33333",
    email: "ramesh.iyer@gh-ernakulam.gov.in",
    status: "active",
    joinedAt: "2016-01-05",
    opdIds: ["opd_006"],
  },
  {
    id: "doc_004",
    hospitalId: "hos_001",
    departmentId: "dep_004",
    name: "Dr. Lakshmi Menon",
    speciality: "Pediatrics",
    phone: "+91 98470 44444",
    email: "lakshmi.menon@gh-ernakulam.gov.in",
    status: "active",
    joinedAt: "2019-11-18",
    opdIds: ["opd_008"],
  },
  {
    id: "doc_005",
    hospitalId: "hos_005",
    departmentId: "dep_011",
    name: "Dr. Suresh Pillai",
    speciality: "General Medicine",
    phone: "+91 98470 55555",
    email: "suresh.pillai@gh-aluva.gov.in",
    status: "active",
    joinedAt: "2017-05-30",
    opdIds: ["opd_015"],
  },
  {
    id: "doc_006",
    hospitalId: "hos_005",
    departmentId: "dep_012",
    name: "Dr. Divya Krishnan",
    speciality: "Pediatrics",
    phone: "+91 98470 66666",
    email: "divya.krishnan@gh-aluva.gov.in",
    status: "active",
    joinedAt: "2020-02-12",
    opdIds: ["opd_017"],
  },
  {
    id: "doc_007",
    hospitalId: "hos_005",
    departmentId: "dep_013",
    name: "Dr. Joseph Mathew",
    speciality: "Dermatology",
    phone: "+91 98470 77777",
    email: "joseph.mathew@gh-aluva.gov.in",
    status: "active",
    joinedAt: "2014-09-01",
    opdIds: ["opd_018"],
  },
  {
    id: "doc_008",
    hospitalId: "hos_006",
    departmentId: "dep_014",
    name: "Dr. Meenakshi Warrier",
    speciality: "General Medicine",
    phone: "+91 98470 88888",
    email: "meenakshi.warrier@gh-perumbavoor.gov.in",
    status: "active",
    joinedAt: "2019-02-14",
    opdIds: ["opd_019"],
  },
  {
    id: "doc_009",
    hospitalId: "hos_006",
    departmentId: "dep_015",
    name: "Dr. Arun George",
    speciality: "Pediatrics",
    phone: "+91 98470 88889",
    email: "arun.george@gh-perumbavoor.gov.in",
    status: "active",
    joinedAt: "2021-06-09",
    opdIds: ["opd_020"],
  },
  {
    id: "doc_010",
    hospitalId: "hos_007",
    departmentId: "dep_016",
    name: "Dr. Sheela Menon",
    speciality: "General Medicine",
    phone: "+91 98470 88890",
    email: "sheela.menon@gh-muvattupuzha.gov.in",
    status: "active",
    joinedAt: "2017-10-03",
    opdIds: ["opd_021"],
  },
  {
    id: "doc_011",
    hospitalId: "hos_007",
    departmentId: "dep_017",
    name: "Dr. Biju Thomas",
    speciality: "Orthopedics",
    phone: "+91 98470 88891",
    email: "biju.thomas@gh-muvattupuzha.gov.in",
    status: "active",
    joinedAt: "2015-12-19",
    opdIds: ["opd_022"],
  },
];

export const mockStaff: StaffMember[] = [
  {
    id: "stf_001",
    hospitalId: "hos_001",
    name: "Radhika Menon",
    role: "receptionist",
    phone: "+91 98470 81001",
    email: "radhika.menon@gh-ernakulam.gov.in",
    status: "active",
    joinedAt: "2019-04-01",
  },
  {
    id: "stf_002",
    hospitalId: "hos_001",
    name: "Sindhu Thomas",
    role: "nurse",
    phone: "+91 98470 81002",
    email: "sindhu.thomas@gh-ernakulam.gov.in",
    status: "active",
    joinedAt: "2016-08-15",
  },
  {
    id: "stf_003",
    hospitalId: "hos_001",
    name: "Rajesh Pillai",
    role: "pharmacist",
    phone: "+91 98470 81003",
    email: "rajesh.pillai@gh-ernakulam.gov.in",
    status: "active",
    joinedAt: "2018-02-20",
  },
  {
    id: "stf_004",
    hospitalId: "hos_001",
    name: "Deepa S",
    role: "lab_technician",
    phone: "+91 98470 81004",
    email: "deepa.s@gh-ernakulam.gov.in",
    status: "active",
    joinedAt: "2020-10-05",
  },
  {
    id: "stf_005",
    hospitalId: "hos_001",
    name: "Vinu K",
    role: "accountant",
    phone: "+91 98470 81005",
    email: "vinu.k@gh-ernakulam.gov.in",
    status: "active",
    joinedAt: "2017-12-11",
  },
  {
    id: "stf_006",
    hospitalId: "hos_005",
    name: "Ancy Mathew",
    role: "receptionist",
    phone: "+91 98470 82001",
    email: "ancy.mathew@gh-aluva.gov.in",
    status: "active",
    joinedAt: "2021-03-08",
  },
  {
    id: "stf_007",
    hospitalId: "hos_005",
    name: "Jithin Jose",
    role: "nurse",
    phone: "+91 98470 82002",
    email: "jithin.jose@gh-aluva.gov.in",
    status: "active",
    joinedAt: "2018-06-14",
  },
  {
    id: "stf_008",
    hospitalId: "hos_005",
    name: "Neethu V",
    role: "pharmacist",
    phone: "+91 98470 82003",
    email: "neethu.v@gh-aluva.gov.in",
    status: "active",
    joinedAt: "2019-09-23",
  },
  {
    id: "stf_009",
    hospitalId: "hos_005",
    name: "Manu George",
    role: "accountant",
    phone: "+91 98470 82004",
    email: "manu.george@gh-aluva.gov.in",
    status: "active",
    joinedAt: "2020-01-19",
  },
  {
    id: "stf_010",
    hospitalId: "hos_006",
    name: "Deepa Chandran",
    role: "nurse",
    phone: "+91 98470 83001",
    email: "deepa.chandran@gh-perumbavoor.gov.in",
    status: "active",
    joinedAt: "2017-11-02",
  },
  {
    id: "stf_011",
    hospitalId: "hos_006",
    name: "Rajesh Varma",
    role: "receptionist",
    phone: "+91 98470 83002",
    email: "rajesh.varma@gh-perumbavoor.gov.in",
    status: "active",
    joinedAt: "2021-03-15",
  },
  {
    id: "stf_012",
    hospitalId: "hos_006",
    name: "Sneha Pillai",
    role: "lab_technician",
    phone: "+91 98470 83003",
    email: "sneha.pillai@gh-perumbavoor.gov.in",
    status: "inactive",
    joinedAt: "2019-07-08",
  },
  {
    id: "stf_013",
    hospitalId: "hos_007",
    name: "Vinod Krishnan",
    role: "pharmacist",
    phone: "+91 98470 84001",
    email: "vinod.krishnan@gh-muvattupuzha.gov.in",
    status: "active",
    joinedAt: "2016-05-20",
  },
  {
    id: "stf_014",
    hospitalId: "hos_007",
    name: "Lakshmi Sasi",
    role: "nurse",
    phone: "+91 98470 84002",
    email: "lakshmi.sasi@gh-muvattupuzha.gov.in",
    status: "active",
    joinedAt: "2018-10-11",
  },
  {
    id: "stf_015",
    hospitalId: "hos_007",
    name: "Arjun Prasad",
    role: "administrator",
    phone: "+91 98470 84003",
    email: "arjun.prasad@gh-muvattupuzha.gov.in",
    status: "active",
    joinedAt: "2022-01-05",
  },
];

export const HOSPITAL_ADMIN: AdminProfile = {
  id: "adm_001",
  name: "Dr. Sreeja Nambiar",
  email: "admin@gh-ernakulam.gov.in",
  phone: "+91 98470 90001",
  role: "Hospital Administrator",
  hospitalId: DEFAULT_HOSPITAL_ID,
};

export const DISTRICT_ADMIN: DistrictAdminProfile = {
  id: "dadm_001",
  name: "K. P. Vishwanath",
  email: "district-admin@ernakulam.gov.in",
  phone: "+91 98470 90002",
  districtId: DISTRICT_ADMIN_DISTRICT_ID,
};

export const STATE_ADMIN: StateAdminProfile = {
  id: "sadm_001",
  name: "Dr. A. Radhakrishnan",
  email: "state-admin@kerala.gov.in",
  phone: "+91 98470 90003",
};

export const mockAdminSettings: AdminSettings[] = [
  {
    hospitalId: "hos_001",
    queueHealthThresholds: { warning: 10, critical: 20 },
    opdOpenTime: "09:00",
    opdCloseTime: "17:00",
    tokenWindowMinutes: 30,
    updatedAt: "2026-08-16T08:00:00",
    updatedBy: "Dr. Sreeja Nambiar",
  },
  {
    hospitalId: "hos_005",
    queueHealthThresholds: { warning: 12, critical: 24 },
    opdOpenTime: "09:00",
    opdCloseTime: "16:00",
    tokenWindowMinutes: 45,
    updatedAt: "2026-08-15T10:15:00",
    updatedBy: "Dr. Sreeja Nambiar",
  },
];

export const mockNotifications: AdminNotification[] = [
  {
    id: "ntf_001",
    hospitalId: "hos_001",
    type: "alert",
    title: "Queue pressure: General Medicine",
    message: "General Medicine has 42 patients waiting. Consider opening an additional OPD window.",
    createdAt: "2026-08-16T10:05:00",
    read: false,
  },
  {
    id: "ntf_002",
    hospitalId: "hos_001",
    type: "queue",
    title: "Cardiology tokens nearly full",
    message: "The Cardiology Special Clinic has reached full capacity for the day.",
    createdAt: "2026-08-16T09:40:00",
    read: false,
  },
  {
    id: "ntf_003",
    hospitalId: "hos_001",
    type: "info",
    title: "OPD schedule updated",
    message: "Orthopedics Afternoon OPD is unavailable today. Patients are being notified.",
    createdAt: "2026-08-16T08:30:00",
    read: false,
  },
  {
    id: "ntf_004",
    hospitalId: "hos_001",
    type: "system",
    title: "System maintenance",
    message: "Scheduled maintenance window on Sunday from 2:00 AM to 4:00 AM.",
    createdAt: "2026-08-15T12:00:00",
    read: true,
  },
  {
    id: "ntf_005",
    hospitalId: "hos_005",
    type: "alert",
    title: "Queue pressure: General Medicine",
    message: "General Medicine at Aluva has 26 patients waiting.",
    createdAt: "2026-08-16T09:55:00",
    read: false,
  },
  {
    id: "ntf_006",
    hospitalId: "hos_005",
    type: "info",
    title: "New staff account",
    message: "A new lab technician account was created by the state admin.",
    createdAt: "2026-08-15T16:20:00",
    read: false,
  },
];

export const mockDistrictPerformance: DistrictPerformance[] = [
  {
    districtId: "thiruvananthapuram",
    districtName: "Thiruvananthapuram",
    hospitals: 142,
    activeOpds: 78,
    patientsToday: 11820,
    waiting: 1102,
    completed: 9821,
    avgWaitMinutes: 28,
    longestQueue: { hospitalName: "Medical College Thiruvananthapuram", departmentName: "General Medicine" },
  },
  {
    districtId: "kollam",
    districtName: "Kollam",
    hospitals: 98,
    activeOpds: 53,
    patientsToday: 6920,
    waiting: 845,
    completed: 5612,
    avgWaitMinutes: 33,
    longestQueue: { hospitalName: "District Hospital Kollam", departmentName: "Pediatrics" },
  },
  {
    districtId: "pathanamthitta",
    districtName: "Pathanamthitta",
    hospitals: 64,
    activeOpds: 35,
    patientsToday: 4280,
    waiting: 512,
    completed: 3410,
    avgWaitMinutes: 27,
    longestQueue: { hospitalName: "GH Pathanamthitta", departmentName: "General Medicine" },
  },
  {
    districtId: "alappuzha",
    districtName: "Alappuzha",
    hospitals: 76,
    activeOpds: 41,
    patientsToday: 5100,
    waiting: 640,
    completed: 4210,
    avgWaitMinutes: 30,
    longestQueue: { hospitalName: "GH Alappuzha", departmentName: "Dermatology" },
  },
  {
    districtId: "kottayam",
    districtName: "Kottayam",
    hospitals: 84,
    activeOpds: 46,
    patientsToday: 6310,
    waiting: 720,
    completed: 5320,
    avgWaitMinutes: 29,
    longestQueue: { hospitalName: "Government Medical College Kottayam", departmentName: "General Medicine" },
  },
  {
    districtId: "idukki",
    districtName: "Idukki",
    hospitals: 48,
    activeOpds: 26,
    patientsToday: 2980,
    waiting: 380,
    completed: 2410,
    avgWaitMinutes: 26,
    longestQueue: { hospitalName: "GH Thodupuzha", departmentName: "General Medicine" },
  },
  {
    districtId: "ernakulam",
    districtName: "Ernakulam",
    hospitals: 18,
    activeOpds: 74,
    patientsToday: 4281,
    waiting: 612,
    completed: 3102,
    avgWaitMinutes: 31,
    longestQueue: { hospitalName: "Government Hospital Aluva", departmentName: "General Medicine" },
  },
  {
    districtId: "thrissur",
    districtName: "Thrissur",
    hospitals: 104,
    activeOpds: 57,
    patientsToday: 8920,
    waiting: 981,
    completed: 7340,
    avgWaitMinutes: 34,
    longestQueue: { hospitalName: "District Hospital Thrissur", departmentName: "General Medicine" },
  },
  {
    districtId: "palakkad",
    districtName: "Palakkad",
    hospitals: 92,
    activeOpds: 50,
    patientsToday: 6180,
    waiting: 764,
    completed: 5030,
    avgWaitMinutes: 32,
    longestQueue: { hospitalName: "District Hospital Palakkad", departmentName: "Orthopedics" },
  },
  {
    districtId: "malappuram",
    districtName: "Malappuram",
    hospitals: 118,
    activeOpds: 64,
    patientsToday: 8840,
    waiting: 1010,
    completed: 7280,
    avgWaitMinutes: 36,
    longestQueue: { hospitalName: "GH Malappuram", departmentName: "Pediatrics" },
  },
  {
    districtId: "kozhikode",
    districtName: "Kozhikode",
    hospitals: 126,
    activeOpds: 69,
    patientsToday: 8410,
    waiting: 872,
    completed: 6980,
    avgWaitMinutes: 29,
    longestQueue: { hospitalName: "Government Hospital Kozhikode", departmentName: "Cardiology" },
  },
  {
    districtId: "wayanad",
    districtName: "Wayanad",
    hospitals: 42,
    activeOpds: 23,
    patientsToday: 2180,
    waiting: 291,
    completed: 1730,
    avgWaitMinutes: 25,
    longestQueue: { hospitalName: "GH Kalpetta", departmentName: "General Medicine" },
  },
  {
    districtId: "kannur",
    districtName: "Kannur",
    hospitals: 94,
    activeOpds: 51,
    patientsToday: 6420,
    waiting: 733,
    completed: 5230,
    avgWaitMinutes: 31,
    longestQueue: { hospitalName: "District Hospital Kannur", departmentName: "General Medicine" },
  },
  {
    districtId: "kasaragod",
    districtName: "Kasaragod",
    hospitals: 56,
    activeOpds: 30,
    patientsToday: 3120,
    waiting: 402,
    completed: 2480,
    avgWaitMinutes: 28,
    longestQueue: { hospitalName: "GH Kasaragod", departmentName: "Pediatrics" },
  },
];

export const mockGovernmentAlerts: GovernmentAlert[] = [
  {
    id: "gal_001",
    districtId: "ernakulam",
    hospitalId: "hos_005",
    hospitalName: "Government Hospital Aluva",
    departmentName: "General Medicine",
    severity: "critical",
    type: "queue_above_threshold",
    message: "32 patients waiting. Average waiting time ~78 minutes.",
    createdAt: "2026-08-16T10:18:00",
    status: "active",
  },
  {
    id: "gal_002",
    districtId: "ernakulam",
    hospitalId: "hos_001",
    hospitalName: "Government Hospital Ernakulam",
    departmentName: "Cardiology",
    severity: "critical",
    type: "doctor_unavailable",
    message: "Doctor unavailable. Morning OPD is not accepting new tokens.",
    createdAt: "2026-08-16T10:05:00",
    status: "active",
  },
  {
    id: "gal_003",
    districtId: "thrissur",
    hospitalId: "hos_003",
    hospitalName: "District Hospital Thrissur",
    departmentName: "Orthopedics",
    severity: "warning",
    type: "queue_above_threshold",
    message: "Queue above threshold. 41 patients waiting.",
    createdAt: "2026-08-16T09:52:00",
    status: "active",
  },
  {
    id: "gal_004",
    districtId: "kozhikode",
    hospitalId: "hos_004",
    hospitalName: "Government Hospital Kozhikode",
    departmentName: "Cardiology",
    severity: "warning",
    type: "opd_full",
    message: "Morning OPD has reached full capacity for the day.",
    createdAt: "2026-08-16T09:30:00",
    status: "active",
  },
  {
    id: "gal_005",
    districtId: "kottayam",
    hospitalId: "hos_002",
    hospitalName: "Government Medical College Kottayam",
    departmentName: "General Medicine",
    severity: "warning",
    type: "long_wait",
    message: "Average waiting time crossed 45 minutes.",
    createdAt: "2026-08-16T09:15:00",
    status: "active",
  },
  {
    id: "gal_006",
    districtId: "ernakulam",
    hospitalId: "hos_006",
    hospitalName: "Government Hospital Perumbavoor",
    departmentName: "Pediatrics",
    severity: "info",
    type: "opd_full",
    message: "Pediatrics OPD is nearing capacity.",
    createdAt: "2026-08-15T11:40:00",
    status: "resolved",
  },
  {
    id: "gal_007",
    districtId: "kannur",
    hospitalId: "hos_009",
    hospitalName: "District Hospital Kannur",
    departmentName: "General Medicine",
    severity: "warning",
    type: "long_wait",
    message: "Queue recovered after additional OPD window opened.",
    createdAt: "2026-08-15T08:50:00",
    status: "resolved",
  },
];

export const mockPatients: Record<string, PatientSummary> = {
  P10294: {
    id: "P10294",
    patientNumber: "KL-ERN-10294",
    name: "Rahul K",
    age: 45,
    gender: "male",
    phone: "+91 98470 12345",
    bloodGroup: "O+",
    registeredHospitalId: "hos_001",
    knownInfo: {
      allergies: ["Penicillin"],
      medications: ["Metformin 500mg"],
      conditions: ["Hypertension"],
    },
  },
  P10301: {
    id: "P10301",
    patientNumber: "KL-ERN-10301",
    name: "Meera S",
    age: 34,
    gender: "female",
    phone: "+91 98470 23456",
    registeredHospitalId: "hos_001",
    knownInfo: { allergies: [], medications: [], conditions: [] },
  },
  P10302: {
    id: "P10302",
    patientNumber: "KL-ERN-10302",
    name: "Arun T",
    age: 58,
    gender: "male",
    phone: "+91 98470 34567",
    bloodGroup: "B+",
    registeredHospitalId: "hos_001",
    knownInfo: { allergies: ["Sulfa drugs"], medications: ["Aspirin 75mg"], conditions: ["Diabetes"] },
  },
  P10303: {
    id: "P10303",
    patientNumber: "KL-ERN-10303",
    name: "Fathima K",
    age: 29,
    gender: "female",
    phone: "+91 98470 45678",
    registeredHospitalId: "hos_001",
    knownInfo: { allergies: [], medications: [], conditions: [] },
  },
  P10304: {
    id: "P10304",
    patientNumber: "KL-ERN-10304",
    name: "John P",
    age: 62,
    gender: "male",
    phone: "+91 98470 56789",
    registeredHospitalId: "hos_001",
    knownInfo: { allergies: [], medications: ["Atorvastatin 10mg"], conditions: ["Hypertension"] },
  },
  P10305: {
    id: "P10305",
    patientNumber: "KL-ERN-10305",
    name: "Lakshmi N",
    age: 41,
    gender: "female",
    phone: "+91 98470 67890",
    registeredHospitalId: "hos_001",
    knownInfo: { allergies: [], medications: [], conditions: ["Asthma"] },
  },
  P10306: {
    id: "P10306",
    patientNumber: "KL-ERN-10306",
    name: "Suresh V",
    age: 50,
    gender: "male",
    phone: "+91 98470 78901",
    registeredHospitalId: "hos_001",
    knownInfo: { allergies: [], medications: [], conditions: [] },
  },
  P10307: {
    id: "P10307",
    patientNumber: "KL-ERN-10307",
    name: "Anitha R",
    age: 36,
    gender: "female",
    phone: "+91 98470 89012",
    registeredHospitalId: "hos_001",
    knownInfo: { allergies: ["Dust"], medications: [], conditions: [] },
  },
  P10421: {
    id: "P10421",
    patientNumber: "KL-ALV-10421",
    name: "Anu M",
    age: 27,
    gender: "female",
    phone: "+91 98470 45670",
    bloodGroup: "A+",
    registeredHospitalId: "hos_005",
    knownInfo: { allergies: [], medications: [], conditions: [] },
  },
  P10892: {
    id: "P10892",
    patientNumber: "KL-ALV-10892",
    name: "Suresh P",
    age: 55,
    gender: "male",
    phone: "+91 98470 56780",
    bloodGroup: "O-",
    registeredHospitalId: "hos_005",
    knownInfo: { allergies: ["Penicillin"], medications: [], conditions: ["Hypertension"] },
  },
};

export const mockEncounters: Encounter[] = [
  {
    id: "E20260819003",
    patientId: "P10421",
    doctorId: "doc_001",
    hospitalId: "hos_001",
    departmentId: "dep_001",
    opdId: "opd_001",
    tokenId: "tok_reg_001",
    tokenNumber: "A-039",
    date: "2026-08-19",
    hospitalName: "Government Hospital Ernakulam",
    departmentName: "Cardiology",
    doctorName: "Dr. Anil Kumar",
    status: "in_progress",
    startedAt: "2026-08-19T10:05:00",
    createdAt: "2026-08-19T10:02:00",
    updatedAt: "2026-08-19T10:05:00",
  },
  {
    id: "E20260815001",
    patientId: "P10294",
    doctorId: "doc_001",
    hospitalId: "hos_001",
    departmentId: "dep_001",
    opdId: "opd_001",
    tokenNumber: "A-039",
    date: "2026-08-15",
    hospitalName: "Government Hospital Ernakulam",
    departmentName: "Cardiology",
    doctorName: "Dr. Anil Kumar",
    status: "completed",
    startedAt: "2026-08-15T09:25:00",
    completedAt: "2026-08-15T09:50:00",
    createdAt: "2026-08-15T09:20:00",
    updatedAt: "2026-08-15T09:50:00",
  },
  {
    id: "E20260602001",
    patientId: "P10294",
    doctorId: "doc_001",
    hospitalId: "hos_001",
    departmentId: "dep_002",
    opdId: "opd_004",
    tokenNumber: "G-044",
    date: "2026-06-02",
    hospitalName: "Government Hospital Ernakulam",
    departmentName: "General Medicine",
    doctorName: "Dr. Anil Kumar",
    status: "completed",
    startedAt: "2026-06-02T10:10:00",
    completedAt: "2026-06-02T10:40:00",
    createdAt: "2026-06-02T10:05:00",
    updatedAt: "2026-06-02T10:40:00",
  },
  {
    id: "E20260112001",
    patientId: "P10294",
    doctorId: "doc_001",
    hospitalId: "hos_001",
    departmentId: "dep_001",
    opdId: "opd_001",
    tokenNumber: "A-012",
    date: "2026-01-12",
    hospitalName: "Government Hospital Ernakulam",
    departmentName: "Cardiology",
    doctorName: "Dr. Anil Kumar",
    status: "completed",
    startedAt: "2026-01-12T11:05:00",
    completedAt: "2026-01-12T11:30:00",
    createdAt: "2026-01-12T11:00:00",
    updatedAt: "2026-01-12T11:30:00",
  },
  {
    id: "E20260810001",
    patientId: DEMO_PATIENT_ID,
    doctorId: "doc_001",
    hospitalId: "hos_001",
    departmentId: "dep_002",
    opdId: "opd_004",
    tokenNumber: "G-102",
    date: "2026-08-10",
    hospitalName: "Government Hospital Ernakulam",
    departmentName: "General Medicine",
    doctorName: "Dr. Anil Kumar",
    status: "completed",
    startedAt: "2026-08-10T09:20:00",
    completedAt: "2026-08-10T09:50:00",
    createdAt: "2026-08-10T09:15:00",
    updatedAt: "2026-08-10T09:50:00",
  },
  {
    id: "E20260802001",
    patientId: "P10302",
    doctorId: "doc_002",
    hospitalId: "hos_001",
    departmentId: "dep_002",
    opdId: "opd_004",
    tokenNumber: "G-055",
    date: "2026-08-02",
    hospitalName: "Government Hospital Ernakulam",
    departmentName: "General Medicine",
    doctorName: "Dr. Geetha Nair",
    status: "completed",
    startedAt: "2026-08-02T10:15:00",
    completedAt: "2026-08-02T10:35:00",
    createdAt: "2026-08-02T10:10:00",
    updatedAt: "2026-08-02T10:35:00",
  },
  {
    id: "E20260718001",
    patientId: "P10305",
    doctorId: "doc_003",
    hospitalId: "hos_001",
    departmentId: "dep_003",
    opdId: "opd_006",
    tokenNumber: "O-010",
    date: "2026-07-18",
    hospitalName: "Government Hospital Ernakulam",
    departmentName: "Orthopedics",
    doctorName: "Dr. Ramesh Iyer",
    status: "completed",
    startedAt: "2026-07-18T11:05:00",
    completedAt: "2026-07-18T11:25:00",
    createdAt: "2026-07-18T11:00:00",
    updatedAt: "2026-07-18T11:25:00",
  },
  {
    id: "E20260816001",
    patientId: "P10421",
    doctorId: "doc_005",
    hospitalId: "hos_005",
    departmentId: "dep_011",
    opdId: "opd_015",
    tokenNumber: "G-031",
    date: "2026-08-16",
    hospitalName: "Government Hospital Aluva",
    departmentName: "General Medicine",
    doctorName: "Dr. Suresh Pillai",
    status: "completed",
    startedAt: "2026-08-16T09:35:00",
    completedAt: "2026-08-16T10:00:00",
    createdAt: "2026-08-16T09:30:00",
    updatedAt: "2026-08-16T10:00:00",
  },
  {
    id: "E20260815002",
    patientId: "P10892",
    doctorId: "doc_006",
    hospitalId: "hos_005",
    departmentId: "dep_012",
    opdId: "opd_017",
    tokenNumber: "P-008",
    date: "2026-08-15",
    hospitalName: "Government Hospital Aluva",
    departmentName: "Pediatrics",
    doctorName: "Dr. Divya Krishnan",
    status: "completed",
    startedAt: "2026-08-15T10:10:00",
    completedAt: "2026-08-15T10:30:00",
    createdAt: "2026-08-15T10:05:00",
    updatedAt: "2026-08-15T10:30:00",
  },
];

function buildQueue(): QueueEntry[] {
  const mk = (
    n: number,
    status: QueueStatus,
    patient?: { id: string; name: string },
    priority: QueuePriority = "normal"
  ): QueueEntry => ({
    tokenNumber: `A-${String(n).padStart(3, "0")}`,
    status,
    isCurrentUser: n === 47,
    patientId: patient?.id ?? null,
    patientName: patient?.name ?? null,
    priority,
  });

  const entries: QueueEntry[] = [];
  for (let n = 1; n <= 28; n += 1) entries.push(mk(n, "completed"));
  entries.push(mk(29, "skipped"));
  for (let n = 30; n <= 33; n += 1) entries.push(mk(n, "completed"));
  entries.push(mk(34, "skipped"));
  for (let n = 35; n <= 38; n += 1) entries.push(mk(n, "completed"));
  entries.push(mk(39, "in_consultation", { id: "P10421", name: "Anu M" }));

  const waiting: Array<[number, string, string]> = [
    [40, "P10301", "Meera S"],
    [41, "P10302", "Arun T"],
    [42, "P10303", "Fathima K"],
    [43, "P10304", "John P"],
    [44, "P10305", "Lakshmi N"],
    [45, "P10306", "Suresh V"],
    [46, "P10307", "Anitha R"],
    [47, DEMO_PATIENT_ID, "Rahul K"],
  ];
  for (const [n, id, name] of waiting) entries.push(mk(n, "waiting", { id, name }));

  const byToken = (tokenNumber: string) => entries.find((e) => e.tokenNumber === tokenNumber);
  const a41 = byToken("A-041");
  if (a41) a41.priority = "priority";
  const a43 = byToken("A-043");
  if (a43) a43.priority = "emergency";
  const a46 = byToken("A-046");
  if (a46) a46.priority = "priority";

  return entries;
}

export const mockQueue: QueueEntry[] = buildQueue();

const queuePatientPool: Array<{ id: string; name: string }> = [
  { id: "P10301", name: "Meera S" },
  { id: "P10302", name: "Arun T" },
  { id: "P10303", name: "Fathima K" },
  { id: "P10304", name: "John P" },
  { id: "P10305", name: "Lakshmi N" },
  { id: "P10306", name: "Suresh V" },
  { id: "P10307", name: "Anitha R" },
  { id: "P10421", name: "Anu M" },
  { id: "P10892", name: "Suresh P" },
];

function buildGeneratedQueue(opdId: string, prefix: string, currentServing: string): QueueEntry[] {
  const current = parseInt(currentServing.split("-")[1] ?? "", 10) || 30;
  const seed = parseInt(opdId.replace(/\D/g, ""), 10) || 1;
  const mk = (n: number, status: QueueStatus, patient?: { id: string; name: string }): QueueEntry => ({
    tokenNumber: `${prefix}-${String(n).padStart(3, "0")}`,
    status,
    isCurrentUser: false,
    patientId: patient?.id ?? null,
    patientName: patient?.name ?? null,
    priority: "normal",
  });

  const entries: QueueEntry[] = [];
  for (let n = 1; n < current; n += 1) {
    entries.push((n + seed) % 15 === 0 ? mk(n, "skipped") : mk(n, "completed"));
  }
  const currentPatient = queuePatientPool[(seed - 1) % queuePatientPool.length];
  entries.push(mk(current, "in_consultation", currentPatient));
  const waitingCount = 4 + (seed % 4);
  for (let n = current + 1; n <= current + waitingCount; n += 1) {
    const patient = queuePatientPool[(n * seed) % queuePatientPool.length];
    entries.push(mk(n, "waiting", patient));
  }
  return entries;
}

const generatedQueues = new Map<string, QueueEntry[]>();

export function getOpdHospitalId(opdId: string): string | undefined {
  const opd = mockOpds.find((o) => o.id === opdId);
  if (!opd) return undefined;
  return mockDepartments.find((d) => d.id === opd.departmentId)?.hospitalId;
}

export function listQueue(opdId: string): QueueEntry[] {
  if (opdId === "opd_001") return mockQueue;

  const opd = getOpd(opdId);
  if (!opd || opd.status === "closed" || opd.status === "unavailable") return [];

  const hospitalId = getOpdHospitalId(opdId);
  if (!hospitalId || !mockHospitals.some((h) => h.id === hospitalId)) return [];

  const cached = generatedQueues.get(opdId);
  if (cached) return cached;

  const currentServing = opd.currentlyServing ?? "T-001";
  const prefix = (currentServing.split("-")[0] || "T").toUpperCase();
  const queue = buildGeneratedQueue(opdId, prefix, currentServing);
  generatedQueues.set(opdId, queue);
  return queue;
}

export function getDoctor(): DoctorProfile {
  return DOCTOR;
}

export function getPatient(id: string): PatientSummary | undefined {
  return mockPatients[id];
}

export function getEncounter(id: string): Encounter | undefined {
  return mockEncounters.find((e) => e.id === id);
}

export function listEncounters(patientId: string): Encounter[] {
  return mockEncounters
    .filter((e) => e.patientId === patientId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function listAllEncounters(): Encounter[] {
  return [...mockEncounters].sort((a, b) => b.date.localeCompare(a.date));
}

export function createEncounterForToken(tokenNumber: string): Encounter | undefined {
  const existing = mockEncounters.find((e) => e.tokenNumber === tokenNumber);
  if (existing) return existing;

  const entry = mockQueue.find((q) => q.tokenNumber === tokenNumber);
  if (!entry || !entry.patientId) return undefined;

  const opd = mockOpds.find((o) => o.id === "opd_001");
  const department = opd ? mockDepartments.find((d) => d.id === opd.departmentId) : undefined;
  const hospital = department
    ? mockHospitals.find((h) => h.id === department.hospitalId)
    : undefined;
  const now = new Date().toISOString();

  const encounter: Encounter = {
    id: `E${Date.now()}`,
    patientId: entry.patientId,
    doctorId: DOCTOR.id,
    hospitalId: hospital?.id ?? DOCTOR.hospitalId,
    departmentId: department?.id ?? DOCTOR.departmentId,
    opdId: opd?.id ?? "opd_001",
    tokenNumber,
    date: now.slice(0, 10),
    hospitalName: hospital?.name ?? DOCTOR.hospitalName,
    departmentName: department?.name ?? DOCTOR.departmentName,
    doctorName: DOCTOR.name,
    status: "open",
    createdAt: now,
    updatedAt: now,
  };

  mockEncounters.unshift(encounter);
  return encounter;
}

function findQueueEntry(tokenNumber: string): QueueEntry | undefined {
  const entry = mockQueue.find((q) => q.tokenNumber === tokenNumber);
  if (entry) return entry;
  for (const list of generatedQueues.values()) {
    const generated = list.find((q) => q.tokenNumber === tokenNumber);
    if (generated) return generated;
  }
  return undefined;
}

export function setQueueEntryStatus(tokenNumber: string, status: QueueStatus): void {
  const entry = findQueueEntry(tokenNumber);
  if (entry) entry.status = status;
}

export function setQueueEntryPriority(tokenNumber: string, priority: QueuePriority): void {
  const entry = findQueueEntry(tokenNumber);
  if (entry) {
    entry.priority = priority;
    entry.overrideAhead = false;
  }
}

export function setQueueEntryOverride(tokenNumber: string, overrideAhead: boolean): void {
  const entry = findQueueEntry(tokenNumber);
  if (entry) entry.overrideAhead = overrideAhead;
}

export function registerQueueEntry(
  opdId: string,
  entry: { tokenNumber: string; patientId: string; patientName: string }
): QueueEntry | undefined {
  const queue = listQueue(opdId);
  if (queue.length === 0 && opdId !== "opd_001") return undefined;
  const queued: QueueEntry = {
    tokenNumber: entry.tokenNumber,
    status: "waiting",
    isCurrentUser: false,
    patientId: entry.patientId,
    patientName: entry.patientName,
    priority: "normal",
  };
  queue.push(queued);
  return queued;
}

export function updateEncounter(id: string, patch: Partial<Encounter>): Encounter | undefined {
  const encounter = mockEncounters.find((e) => e.id === id);
  if (encounter) Object.assign(encounter, patch, { updatedAt: new Date().toISOString() });
  return encounter;
}

export function countQueueStatuses(opdId: string): OPDCounts {
  const queue = listQueue(opdId);
  return {
    total: queue.length,
    completed: queue.filter((q) => q.status === "completed").length,
    waiting: queue.filter((q) => q.status === "waiting").length,
    skipped: queue.filter((q) => q.status === "skipped").length,
    inConsultation: queue.filter((q) => q.status === "in_consultation").length,
    cancelled: queue.filter((q) => q.status === "cancelled").length,
  };
}

export function getHospital(id: string): Hospital | undefined {
  return mockHospitals.find((h) => h.id === id);
}

export function getDepartment(id: string): Department | undefined {
  return mockDepartments.find((d) => d.id === id);
}

export function getOpd(id: string): OPD | undefined {
  return mockOpds.find((o) => o.id === id);
}

export function listDepartments(hospitalId: string): Department[] {
  return mockDepartments.filter((d) => d.hospitalId === hospitalId);
}

export function listOpds(departmentId: string): OPD[] {
  return mockOpds.filter((o) => o.departmentId === departmentId);
}

export function getActiveToken(patientId: string): Token | undefined {
  return mockTokens.find((t) => t.patientId === patientId && t.status !== "completed");
}

export function listOpdsByHospital(hospitalId: string): OPD[] {
  const departmentIds = new Set(
    mockDepartments.filter((d) => d.hospitalId === hospitalId).map((d) => d.id)
  );
  return mockOpds.filter((o) => departmentIds.has(o.departmentId));
}

export function listHospitalsByDistrict(districtId: DistrictId): Hospital[] {
  return mockHospitals.filter((h) => h.districtId === districtId);
}

export function countHospitalsByDistrict(districtId: DistrictId): number {
  return listHospitalsByDistrict(districtId).length;
}

export function listAllAlerts(): GovernmentAlert[] {
  return [...mockGovernmentAlerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAlertsByDistrict(districtId: DistrictId): GovernmentAlert[] {
  return listAllAlerts().filter((a) => a.districtId === districtId);
}

export function countWaitingByOpd(opdId: string): number {
  return listQueue(opdId).filter((q) => q.status === "waiting").length;
}

export function countTokensByHospital(hospitalId: string): number {
  return listOpdsByHospital(hospitalId).reduce((sum, opd) => sum + listQueue(opd.id).length, 0);
}

export function countWaitingByHospital(hospitalId: string): number {
  return listOpdsByHospital(hospitalId).reduce(
    (sum, opd) => sum + countWaitingByOpd(opd.id),
    0
  );
}

export function countCompletedTokensByHospital(hospitalId: string): number {
  return listOpdsByHospital(hospitalId).reduce(
    (sum, opd) =>
      sum + listQueue(opd.id).filter((q) => q.status === "completed").length,
    0
  );
}

export function countDepartmentsByHospital(hospitalId: string): number {
  return listDepartments(hospitalId).length;
}

export function countDoctorsByHospital(hospitalId: string): number {
  return mockDoctors.filter((d) => d.hospitalId === hospitalId).length;
}

export function countStaffByHospital(hospitalId: string): number {
  return mockStaff.filter((s) => s.hospitalId === hospitalId).length;
}

export function countPatientsByHospital(hospitalId: string): number {
  return Object.values(mockPatients).filter((p) => p.registeredHospitalId === hospitalId).length;
}

export function listPatientsByHospital(hospitalId: string): PatientSummary[] {
  return Object.values(mockPatients).filter((p) => p.registeredHospitalId === hospitalId);
}

export function listDoctorsByHospital(hospitalId: string): DoctorRecord[] {
  return mockDoctors.filter((d) => d.hospitalId === hospitalId);
}

export function listStaffByHospital(hospitalId: string): StaffMember[] {
  return mockStaff.filter((s) => s.hospitalId === hospitalId);
}

export function listNotificationsByHospital(hospitalId: string): AdminNotification[] {
  return mockNotifications
    .filter((n) => n.hospitalId === hospitalId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function markNotificationRead(id: string): void {
  const notification = mockNotifications.find((n) => n.id === id);
  if (notification) notification.read = true;
}

export function getSettings(hospitalId: string): AdminSettings | undefined {
  return mockAdminSettings.find((s) => s.hospitalId === hospitalId);
}

export function saveSettings(
  hospitalId: string,
  patch: Partial<Pick<AdminSettings, "queueHealthThresholds" | "opdOpenTime" | "opdCloseTime" | "tokenWindowMinutes">>,
  updatedBy: string
): AdminSettings {
  let settings = mockAdminSettings.find((s) => s.hospitalId === hospitalId);
  if (!settings) {
    settings = {
      hospitalId,
      queueHealthThresholds: { warning: 10, critical: 20 },
      opdOpenTime: "09:00",
      opdCloseTime: "17:00",
      tokenWindowMinutes: 30,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    mockAdminSettings.push(settings);
  }
  Object.assign(settings, patch, {
    updatedAt: new Date().toISOString(),
    updatedBy,
  });
  return settings;
}

function nextId(prefix: string, existing: string[]): string {
  const max = existing.reduce((acc, id) => {
    const num = parseInt(id.split("_")[1] ?? "0", 10);
    return Number.isNaN(num) ? acc : Math.max(acc, num);
  }, 0);
  return `${prefix}_${String(max + 1).padStart(3, "0")}`;
}

export function addDepartment(hospitalId: string, name: string): Department {
  const code = name.replace(/[^a-zA-Z]/g, "").slice(0, 6).toUpperCase() || "DEPT";
  const department: Department = {
    id: nextId("dep", mockDepartments.map((d) => d.id)),
    hospitalId,
    code,
    name,
    waitingCount: 0,
    status: "active",
  };
  mockDepartments.push(department);
  return department;
}

export function setDepartmentStatus(id: string, status: Department["status"]): void {
  const department = getDepartment(id);
  if (department) department.status = status;
}

export function addDoctor(input: {
  hospitalId: string;
  departmentId: string;
  name: string;
  speciality: string;
  phone: string;
  email: string;
}): DoctorRecord {
  const doctor: DoctorRecord = {
    id: nextId("doc", mockDoctors.map((d) => d.id)),
    hospitalId: input.hospitalId,
    departmentId: input.departmentId,
    name: input.name,
    speciality: input.speciality,
    phone: input.phone,
    email: input.email,
    status: "active",
    joinedAt: new Date().toISOString().slice(0, 10),
    opdIds: [],
  };
  mockDoctors.push(doctor);
  return doctor;
}

export function setDoctorStatus(id: string, status: DoctorRecord["status"]): void {
  const doctor = mockDoctors.find((d) => d.id === id);
  if (doctor) doctor.status = status;
}

export function addOpd(input: {
  departmentId: string;
  name: string;
  startTime: string;
  endTime: string;
}): OPD {
  const opd: OPD = {
    id: nextId("opd", mockOpds.map((o) => o.id)),
    departmentId: input.departmentId,
    name: input.name,
    startTime: input.startTime,
    endTime: input.endTime,
    status: "open",
    currentlyServing: null,
    estimatedWaitMinutes: null,
  };
  mockOpds.push(opd);
  return opd;
}

export function setOpdStatus(id: string, status: OPD["status"], reason?: string): void {
  const opd = getOpd(id);
  if (opd) {
    opd.status = status;
    opd.statusReason = status === "paused" ? reason : undefined;
    opd.statusUpdatedAt = new Date().toISOString();
  }
}
