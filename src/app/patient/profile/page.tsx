"use client";

import Link from "next/link";
import { AllergyCard } from "@/features/medical-records/components/AllergyCard";
import { ConditionCard } from "@/features/medical-records/components/ConditionCard";
import { MedicationCard } from "@/features/medical-records/components/MedicationCard";
import { RecordAccessNotice } from "@/features/medical-records/components/RecordAccessNotice";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usePatientProfile } from "@/features/medical-records/hooks/useMedicalRecords";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";

function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      id={id}
      className="rounded-card border border-ink-200 bg-surface p-5 shadow-card"
    >
      <h2 id={`${id}-title`} className="text-lg font-semibold text-ink-900">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { data, isLoading, error, reload } = usePatientProfile(user?.id ?? "");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load profile."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{data.name}</h1>
        <p className="mt-1 text-sm text-ink-500">
          {data.id} &middot; {data.age} yrs &middot; {data.gender}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <Section title="Personal Information" id="personal">
          <dl className="divide-y divide-ink-100 text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-ink-500">Date of birth</dt>
              <dd className="font-medium tabular-nums text-ink-900">{data.dateOfBirth ?? "—"}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-ink-500">Blood group</dt>
              <dd className="font-medium text-ink-900">{data.bloodGroup ?? "—"}</dd>
            </div>
          </dl>
        </Section>

        <Section title="Contact Information" id="contact">
          <dl className="divide-y divide-ink-100 text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-ink-500">Phone</dt>
              <dd className="font-medium tabular-nums text-ink-900">{data.phone}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-ink-500">Email</dt>
              <dd className="font-medium text-ink-900">{data.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-ink-500">Address</dt>
              <dd className="font-medium text-ink-900">{data.address ?? "—"}</dd>
            </div>
          </dl>
        </Section>

        <Section title="Emergency Contact" id="emergency">
          {data.emergencyContact ? (
            <dl className="divide-y divide-ink-100 text-sm">
              <div className="flex justify-between py-2">
                <dt className="text-ink-500">Name</dt>
                <dd className="font-medium text-ink-900">{data.emergencyContact.name}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-ink-500">Relation</dt>
                <dd className="font-medium text-ink-900">{data.emergencyContact.relation}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-ink-500">Phone</dt>
                <dd className="font-medium tabular-nums text-ink-900">{data.emergencyContact.phone}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-ink-500">No emergency contact recorded.</p>
          )}
        </Section>

        <Section title="Preferences" id="preferences">
          <dl className="divide-y divide-ink-100 text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-ink-500">Preferred language</dt>
              <dd className="font-medium text-ink-900">{data.languagePreference}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-ink-500">Notifications</dt>
              <dd className="font-medium text-ink-900">
                <Link
                  href="/patient/notifications?tab=preferences"
                  className="text-brand-700 hover:underline"
                >
                  Manage notification preferences
                </Link>
              </dd>
            </div>
          </dl>
        </Section>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-ink-900">Clinical Information</h2>
          </div>
          <RecordAccessNotice audience="patient" />

          <Section title="Allergies" id="allergies">
            {data.allergies.length === 0 ? (
              <p className="text-sm text-ink-500">None recorded</p>
            ) : (
              <ul className="space-y-2">
                {data.allergies.map((allergy) => (
                  <AllergyCard key={allergy.id} {...allergy} />
                ))}
              </ul>
            )}
          </Section>

          <Section title="Medical Conditions" id="conditions">
            {data.conditions.length === 0 ? (
              <p className="text-sm text-ink-500">None recorded</p>
            ) : (
              <ul className="space-y-2">
                {data.conditions.map((condition) => (
                  <ConditionCard key={condition.id} {...condition} />
                ))}
              </ul>
            )}
          </Section>

          <Section title="Current Medications" id="medications">
            {data.medications.length === 0 ? (
              <p className="text-sm text-ink-500">No current medications</p>
            ) : (
              <ul className="space-y-2">
                {data.medications.map((medication) => (
                  <MedicationCard key={medication.id} {...medication} />
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}