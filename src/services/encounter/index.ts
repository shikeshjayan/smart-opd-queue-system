import type { Encounter } from "@/types";
import {
  getEncounter,
  listAllEncounters,
  listEncounters,
  updateEncounter,
} from "../data";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

export const encounterService = {
  async list(patientId: string): Promise<Encounter[]> {
    await delay();
    return listEncounters(patientId);
  },

  async listAll(): Promise<Encounter[]> {
    await delay();
    return listAllEncounters();
  },

  async getById(id: string): Promise<Encounter | undefined> {
    await delay();
    return getEncounter(id);
  },

  async update(id: string, patch: Partial<Encounter>): Promise<Encounter | undefined> {
    await delay();
    return updateEncounter(id, patch);
  },
};
