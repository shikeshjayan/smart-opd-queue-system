import { DISTRICTS, type DistrictId } from "./districts";

export const STATE_NAME = "Kerala";

export const STATE_ID = "state_kerala";

export const keralaDistricts = DISTRICTS;

export type District = {
  id: DistrictId;
  name: string;
  stateId: string;
};

export function listDistricts(): District[] {
  return keralaDistricts.map((d) => ({
    id: d.id,
    name: d.name,
    stateId: STATE_ID,
  }));
}

export function getDistrictById(id: string): District | undefined {
  return listDistricts().find((d) => d.id === id);
}
