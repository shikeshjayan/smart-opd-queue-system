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
  plain: (doc: any) => doc,
  plainList: (docs: any[]) => docs ?? [],
}));
