import { vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({
  dbConnect: vi.fn().mockResolvedValue({}),
}));

const mockLean = vi.fn().mockResolvedValue([]);
const mockFind = vi.fn(() => ({
  lean: mockLean,
  sort: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
}));
const mockCountDocuments = vi.fn().mockResolvedValue(0);
const mockFindById = vi.fn().mockResolvedValue(null);
const mockFindOne = vi.fn().mockResolvedValue(null);
const mockFindOneAndUpdate = vi.fn().mockResolvedValue(null);
const mockCreate = vi.fn().mockResolvedValue({ _id: "mock_id", ...{} });
const mockUpdateOne = vi.fn().mockResolvedValue({});

vi.mock("@/lib/models", () => ({
  HospitalModel: { find: mockFind, findById: mockFindById, countDocuments: mockCountDocuments, updateOne: mockUpdateOne },
  DepartmentModel: { find: mockFind, countDocuments: mockCountDocuments },
  DoctorModel: { find: mockFind, countDocuments: mockCountDocuments },
  StaffModel: { find: mockFind, countDocuments: mockCountDocuments },
  OpdSessionModel: { find: mockFind },
  QueueEntryModel: { find: mockFind },
  HospitalServiceModel: { find: mockFind, countDocuments: mockCountDocuments },
  NotificationModel: { find: mockFind, create: mockCreate },
  AuditLogModel: { find: mockFind },
  AdminSettingsModel: { findOne: mockFindOne, findOneAndUpdate: mockFindOneAndUpdate },
  GovernmentAlertModel: { find: mockFind },
  UserModel: { find: mockFind },
  PatientModel: { find: mockFind, findOne: mockFindOne, findById: mockFindById },
  EncounterModel: { find: mockFind, findOne: mockFindOne, findById: mockFindById, findOneAndUpdate: mockFindOneAndUpdate },
  AllergyModel: { find: mockFind, findOne: mockFindOne, create: mockCreate },
  ConditionModel: { find: mockFind, findOne: mockFindOne, create: mockCreate },
  VitalSignsModel: { find: mockFind, findOne: mockFindOne, create: mockCreate },
  PrescriptionModel: { find: mockFind, create: mockCreate },
  DiagnosticOrderModel: { find: mockFind },
  DiagnosticResultModel: { find: mockFind, findByIdAndUpdate: mockFindOneAndUpdate },
  DocumentMetaModel: { find: mockFind, findByIdAndUpdate: mockFindOneAndUpdate },
  BreakGlassRequestModel: { find: mockFind, findOne: mockFindOne, create: mockCreate, updateMany: mockUpdateOne },
  CorrectionRequestModel: { find: mockFind, create: mockCreate, findByIdAndUpdate: mockFindOneAndUpdate },
  ConsultationModel: { find: mockFind, findOne: mockFindOne },
  nextSequence: vi.fn().mockResolvedValue(1),
  plain: (doc: any) => doc,
  plainList: (docs: any[]) => docs ?? [],
}));
