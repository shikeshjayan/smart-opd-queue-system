import type { OPD, Token, TokenBundle } from "@/types";
import { getActiveToken, getDepartment, getHospital, getOpd, listQueue } from "../data";

const delay = () => new Promise((resolve) => setTimeout(resolve, 500));

const DEPARTMENT_LETTERS: Record<string, string> = {
  dep_001: "A",
  dep_002: "G",
  dep_003: "O",
  dep_004: "P",
  dep_005: "G",
  dep_006: "D",
  dep_007: "G",
  dep_008: "P",
  dep_009: "A",
  dep_010: "E",
};

function buildBundle(opd: OPD, token: Token): TokenBundle | undefined {
  const department = getDepartment(opd.departmentId);
  const hospital = department ? getHospital(department.hospitalId) : undefined;
  if (!department || !hospital) return undefined;
  return { hospital, department, opd, token };
}

export const tokenService = {
  async getActive(patientId: string): Promise<TokenBundle | null> {
    await delay();
    const token = getActiveToken(patientId);
    if (!token) return null;
    const opd = getOpd(token.opdId);
    if (!opd) return null;
    return buildBundle(opd, token) ?? null;
  },

  async create(opdId: string, patientId: string): Promise<TokenBundle> {
    await delay();
    const opd = getOpd(opdId);
    if (!opd) {
      throw new Error("OPD not found");
    }

    const queue = listQueue(opdId);
    const lastNumber = queue.reduce((max, entry) => {
      const num = Number.parseInt(entry.tokenNumber.split("-")[1] ?? "0", 10);
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 47);
    const letter = DEPARTMENT_LETTERS[opd.departmentId] ?? "X";
    const tokenNumber = `${letter}-${String(lastNumber + 1).padStart(3, "0")}`;

    const patientsAhead = queue.filter((q) => q.status === "waiting").length + 1;
    const token: Token = {
      id: `tok_${Date.now()}`,
      tokenNumber,
      patientId,
      opdId,
      status: "waiting",
      patientsAhead,
      estimatedWaitMinutes: opd.estimatedWaitMinutes,
    };

    const bundle = buildBundle(opd, token);
    if (!bundle) {
      throw new Error("Token bundle could not be built");
    }
    return bundle;
  },
};
