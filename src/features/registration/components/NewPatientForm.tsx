"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { NewPatientInput } from "../types/registration.types";

type NewPatientFormProps = {
  busy?: boolean;
  onNext: (input: NewPatientInput) => void;
};

export function NewPatientForm({ busy, onNext }: NewPatientFormProps) {
  const [form, setForm] = useState<NewPatientInput>({
    name: "",
    gender: "male",
    mobile: "",
  });

  function update<K extends keyof NewPatientInput>(key: K, value: NewPatientInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onNext(form);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-700">Full name *</span>
        <Input
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Rahul Kumar"
        />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Date of birth</span>
          <Input
            type="date"
            value={form.dateOfBirth ?? ""}
            onChange={(e) => update("dateOfBirth", e.target.value || undefined)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Gender</span>
          <Select
            value={form.gender}
            onChange={(e) => update("gender", e.target.value as NewPatientInput["gender"])}
            aria-label="Gender"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-700">Mobile number *</span>
        <Input
          type="tel"
          required
          value={form.mobile}
          onChange={(e) => update("mobile", e.target.value)}
          placeholder="+91 98470 12345"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-700">Address</span>
        <Input
          value={form.address ?? ""}
          onChange={(e) => update("address", e.target.value || undefined)}
          placeholder="Street, area, district"
        />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Emergency contact name</span>
          <Input
            value={form.emergencyContactName ?? ""}
            onChange={(e) => update("emergencyContactName", e.target.value || undefined)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Emergency contact phone</span>
          <Input
            type="tel"
            value={form.emergencyContactPhone ?? ""}
            onChange={(e) => update("emergencyContactPhone", e.target.value || undefined)}
          />
        </label>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Checking..." : "Continue to OPD"}
      </Button>
    </form>
  );
}