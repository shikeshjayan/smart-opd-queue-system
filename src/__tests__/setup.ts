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

const mockAggregate = vi.fn().mockResolvedValue([]);
const mockLeanUpdate = vi.fn().mockResolvedValue({ _id: "mock_id", lean: vi.fn().mockResolvedValue({ _id: "mock_id" }) });

vi.mock("@/lib/models", () => ({
  HospitalModel: { find: mockFind, findById: mockFindById, countDocuments: mockCountDocuments, updateOne: mockUpdateOne },
  DepartmentModel: { find: mockFind, countDocuments: mockCountDocuments },
  DoctorModel: { find: mockFind, findOne: mockFindOne, countDocuments: mockCountDocuments },
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
  PrescriptionModel: {
    find: mockFind,
    findOne: mockFindOne,
    findById: mockFindById,
    findByIdAndUpdate: vi.fn().mockResolvedValue({ lean: vi.fn().mockResolvedValue(null), save: vi.fn() }),
    create: mockCreate,
    countDocuments: mockCountDocuments,
  },
  PrescriptionAuditModel: { find: mockFind, create: mockCreate },
  DiagnosticOrderModel: { find: mockFind },
  DiagnosticResultModel: { find: mockFind, findByIdAndUpdate: mockFindOneAndUpdate },
  DocumentMetaModel: { find: mockFind, findByIdAndUpdate: mockFindOneAndUpdate },
  BreakGlassRequestModel: { find: mockFind, findOne: mockFindOne, create: mockCreate, updateMany: mockUpdateOne },
  CorrectionRequestModel: { find: mockFind, create: mockCreate, findByIdAndUpdate: mockFindOneAndUpdate },
  ConsultationModel: { find: mockFind, findOne: mockFindOne },
  ConsultationAuditModel: { find: mockFind, create: mockCreate },
  MedicineModel: { find: mockFind, findOne: mockFindOne, create: mockCreate },
  MedicineStockModel: {
    find: vi.fn().mockReturnValue({ sort: vi.fn().mockReturnThis(), lean: vi.fn().mockResolvedValue([]), select: vi.fn().mockReturnThis() }),
    findOne: mockFindOne,
    findByIdAndUpdate: vi.fn().mockResolvedValue({ lean: vi.fn().mockResolvedValue(null) }),
    aggregate: mockAggregate,
    create: mockCreate,
    countDocuments: mockCountDocuments,
  },
  StockTransactionModel: { find: vi.fn().mockReturnValue({ sort: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), lean: vi.fn().mockResolvedValue([]) }), create: mockCreate },
  PharmacyAuditModel: { create: mockCreate },
  InventoryConfigModel: { find: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }), findOne: mockFindOne, findOneAndUpdate: vi.fn().mockResolvedValue({ lean: vi.fn().mockResolvedValue({ _id: "cfg_1", hospitalId: "hos_001", medicineId: "med_1", minLevel: 10 }) }) },
  DispensingModel: { find: vi.fn().mockReturnValue({ sort: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), lean: vi.fn().mockResolvedValue([]) }), create: mockCreate, countDocuments: mockCountDocuments },
  CounterModel: { find: mockFindById },
  nextSequence: vi.fn().mockResolvedValue(1),
  plain: (doc: any) => doc,
  plainList: (docs: any[]) => docs ?? [],
}));
