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
  {
    id: "P10421",
    name: "Anu M",
    email: "anu.m@example.com",
    phone: "+91 98470 45670",
    dateOfBirth: "1999-02-18",
    bloodGroup: "A+",
    address: "Aluva, Kerala",
  },
  {
    id: "P10301",
    name: "Meera S",
    email: "meera.s@example.com",
    phone: "+91 98470 23456",
    dateOfBirth: "1992-07-05",
    address: "Ernakulam, Kerala",
  },
  {
    id: "P10302",
    name: "Arun T",
    email: "arun.t@example.com",
    phone: "+91 98470 34567",
    dateOfBirth: "1968-11-23",
    bloodGroup: "B+",
    address: "Ernakulam, Kerala",
  },
  {
    id: "P10303",
    name: "Fathima K",
    email: "fathima.k@example.com",
    phone: "+91 98470 45678",
    dateOfBirth: "1997-01-30",
    address: "Ernakulam, Kerala",
  },
  {
    id: "P10304",
    name: "John P",
    email: "john.p@example.com",
    phone: "+91 98470 56789",
    dateOfBirth: "1964-09-14",
    address: "Ernakulam, Kerala",
  },
  {
    id: "P10305",
    name: "Lakshmi N",
    email: "lakshmi.n@example.com",
    phone: "+91 98470 67890",
    dateOfBirth: "1985-03-02",
    address: "Ernakulam, Kerala",
  },
  {
    id: "P10306",
    name: "Suresh V",
    email: "suresh.v@example.com",
    phone: "+91 98470 78901",
    dateOfBirth: "1976-12-25",
    address: "Ernakulam, Kerala",
  },
  {
    id: "P10307",
    name: "Anitha R",
    email: "anitha.r@example.com",
    phone: "+91 98470 89012",
    dateOfBirth: "1990-06-11",
    address: "Ernakulam, Kerala",
  },
  {
    id: "P10892",
    name: "Suresh P",
    email: "suresh.p@example.com",
    phone: "+91 98470 56780",
    dateOfBirth: "1971-05-19",
    bloodGroup: "O-",
    address: "Aluva, Kerala",
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
    return mockPatients.find((p) => p.id === id);
  },

  async update(id: string, payload: Partial<Patient>): Promise<Patient> {
    await delay();
    const patient = mockPatients.find((p) => p.id === id);
    if (!patient) throw new Error("Patient not found");
    return { ...patient, ...payload };
  },
};
