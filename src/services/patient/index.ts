import type { Patient } from "./types";

const mockPatients: Patient[] = [
  {
    id: "P10294",
    name: "Rahul K",
    email: "rahul.k@example.com",
    phone: "+91 98470 12345",
    dateOfBirth: "1981-04-12",
    bloodGroup: "O+",
    address: "Ernakulam, Kerala",
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
