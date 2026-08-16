import type { Patient } from "./types";

const mockPatients: Patient[] = [
  {
    id: "pat_001",
    name: "Demo Patient",
    email: "patient@example.com",
    phone: "+91 90000 00000",
    dateOfBirth: "1992-05-14",
    bloodGroup: "O+",
    address: "Kerala, India",
  },
];

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

export const patientService = {
  async list(): Promise<Patient[]> {
    await delay();
    return mockPatients;
  },

  async getById(id: string): Promise<Patient | undefined> {
    await delay();
    return mockPatients.find((p) => p.id === id) ?? mockPatients[0];
  },

  async update(id: string, payload: Partial<Patient>): Promise<Patient> {
    await delay();
    const patient = mockPatients.find((p) => p.id === id) ?? mockPatients[0];
    return { ...patient, ...payload };
  },
};
