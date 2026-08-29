"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  HospitalModel,
  DistrictModel,
  DistrictConfigModel,
  HospitalConfigModel,
  StateSettingsModel,
  plain,
  plainList,
} from "@/lib/models";
import type { AccessContext } from "@/server/lib/access-context";
import { assertDistrictAccess, assertHospitalAccess, assertAnyDistrictAccess, buildScopeFilter } from "@/server/lib/scope-access";
import type { Hospital, District, DistrictConfig, HospitalConfig, StateSettings } from "@/types";

export class HospitalRepository {
  async findById(hospitalId: string, ctx: AccessContext) {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const doc = await HospitalModel.findById(hospitalId).lean();
    return plain<Hospital>(doc);
  }

  async findAll(ctx: AccessContext, filter: Record<string, unknown> = {}) {
    await dbConnect();
    const scopeFilter = buildScopeFilter(ctx, "hospital");
    const docs = await HospitalModel.find({ ...filter, ...scopeFilter }).lean();
    return plainList<Hospital>(docs);
  }

  async findByDistrict(districtId: string, ctx: AccessContext) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    const docs = await HospitalModel.find({ districtId, ...buildScopeFilter(ctx, "hospital") } as any).lean();
    return plainList<Hospital>(docs);
  }

  async findActiveByDistrict(districtId: string, ctx: AccessContext) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    const docs = await HospitalModel.find({ districtId, status: "active", ...buildScopeFilter(ctx, "hospital") } as any).lean();
    return plainList<Hospital>(docs);
  }

  async create(hospital: Omit<Hospital, "id" | "createdAt" | "updatedAt">, ctx: AccessContext) {
    await dbConnect();
    assertDistrictAccess(ctx, hospital.districtId);
    const doc = await HospitalModel.create({ ...hospital, _id: hospital.code });
    return plain<Hospital>(doc);
  }

  async updateStatus(hospitalId: string, status: Hospital["status"], ctx: AccessContext) {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const doc = await HospitalModel.findByIdAndUpdate(
      hospitalId,
      { $set: { status, updatedAt: new Date() } },
      { new: true }
    ).lean();
    return plain<Hospital>(doc);
  }

  async update(hospitalId: string, data: Partial<Hospital>, ctx: AccessContext) {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const doc = await HospitalModel.findByIdAndUpdate(
      hospitalId,
      { $set: { ...data, updatedAt: new Date() } },
      { new: true }
    ).lean();
    return plain<Hospital>(doc);
  }

  async countByDistrict(districtId: string, ctx: AccessContext) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    return HospitalModel.countDocuments({ districtId, ...buildScopeFilter(ctx, "hospital") } as any);
  }
}

export class DistrictRepository {
  async findById(districtId: string, ctx: AccessContext) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    const doc = await DistrictModel.findById(districtId).lean();
    return plain<District>(doc);
  }

  async findAll(ctx: AccessContext) {
    await dbConnect();
    const scopeFilter = buildScopeFilter(ctx, "district");
    const docs = await DistrictModel.find(scopeFilter).lean();
    return plainList<District>(docs);
  }

  async findActive(ctx: AccessContext) {
    await dbConnect();
    const scopeFilter = buildScopeFilter(ctx, "district");
    const docs = await DistrictModel.find({ status: "active", ...scopeFilter }).lean();
    return plainList<District>(docs);
  }
}

export class DistrictConfigRepository {
  async findByDistrict(districtId: string, ctx: AccessContext) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    const doc = await DistrictConfigModel.findOne({ districtId }).lean();
    return plain<DistrictConfig>(doc);
  }

  async getEffectiveSettings(districtId: string, ctx: AccessContext) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    
    const [stateSettings, districtConfig] = await Promise.all([
      StateSettingsModel.findById("STATE_CONFIG").lean(),
      DistrictConfigModel.findOne({ districtId }).lean(),
    ]);

    const state = plain<StateSettings>(stateSettings);
    const district = plain<DistrictConfig>(districtConfig);

    if (!district) return state;

    return {
      ...state,
      ...district.effectiveSettings,
    };
  }

  async update(districtId: string, overrides: Partial<StateSettings>, ctx: AccessContext) {
    await dbConnect();
    assertDistrictAccess(ctx, districtId);
    
    const current = await this.getEffectiveSettings(districtId, ctx);
    const effectiveSettings = { ...current, ...overrides };

    const doc = await DistrictConfigModel.findOneAndUpdate(
      { districtId },
      { 
        $set: { 
          overrides, 
          effectiveSettings, 
          updatedAt: new Date(), 
          updatedBy: ctx.userId 
        } 
      },
      { upsert: true, new: true }
    ).lean();

    return plain<DistrictConfig>(doc);
  }
}

export class HospitalConfigRepository {
  async findByHospital(hospitalId: string, ctx: AccessContext) {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const doc = await HospitalConfigModel.findOne({ hospitalId }).lean();
    return plain<HospitalConfig>(doc);
  }

  async getEffectiveSettings(hospitalId: string, ctx: AccessContext) {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);

    const [districtConfig, hospitalConfig] = await Promise.all([
      DistrictConfigModel.findOne({ 
        districtId: (await HospitalModel.findById(hospitalId).lean())?.districtId 
      }).lean(),
      HospitalConfigModel.findOne({ hospitalId }).lean(),
    ]);

    const stateSettings = await StateSettingsModel.findById("STATE_CONFIG").lean();
    const state = plain<StateSettings>(stateSettings);

    let effective = { ...state };
    
    if (districtConfig) {
      effective = { ...effective, ...plain<DistrictConfig>(districtConfig).effectiveSettings };
    }
    
    if (hospitalConfig) {
      effective = { ...effective, ...plain<HospitalConfig>(hospitalConfig).effectiveSettings };
    }

    return effective;
  }

  async update(hospitalId: string, overrides: Partial<StateSettings>, ctx: AccessContext) {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    
    const current = await this.getEffectiveSettings(hospitalId, ctx);
    const effectiveSettings = { ...current, ...overrides };

    const doc = await HospitalConfigModel.findOneAndUpdate(
      { hospitalId },
      { 
        $set: { 
          overrides, 
          effectiveSettings, 
          updatedAt: new Date(), 
          updatedBy: ctx.userId 
        } 
      },
      { upsert: true, new: true }
    ).lean();

    return plain<HospitalConfig>(doc);
  }
}

export class StateSettingsRepository {
  async getSettings() {
    await dbConnect();
    const doc = await StateSettingsModel.findById("STATE_CONFIG").lean();
    return plain<StateSettings>(doc);
  }

  async update(overrides: Partial<StateSettings>, ctx: AccessContext) {
    await dbConnect();
    assertAnyDistrictAccess(ctx);
    
    const current = await this.getSettings();
    const effectiveSettings = { ...current, ...overrides };

    const doc = await StateSettingsModel.findByIdAndUpdate(
      "STATE_CONFIG",
      { 
        $set: { 
          ...overrides, 
          updatedAt: new Date(), 
          updatedBy: ctx.userId 
        } 
      },
      { new: true }
    ).lean();

    return plain<StateSettings>(doc);
  }
}

export const hospitalRepository = new HospitalRepository();
export const districtRepository = new DistrictRepository();
export const districtConfigRepository = new DistrictConfigRepository();
export const hospitalConfigRepository = new HospitalConfigRepository();
export const stateSettingsRepository = new StateSettingsRepository();