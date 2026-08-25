"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { useAdminDepartments, useAdminDoctors } from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { ScheduleEditor } from "@/features/hospital-admin/components/ScheduleEditor";
import { ExceptionList } from "@/features/hospital-admin/components/ExceptionList";
import { AppointmentSlotsEditor } from "@/features/hospital-admin/components/AppointmentSlotsEditor";
import { ShiftsEditor } from "@/features/hospital-admin/components/ShiftsEditor";
import { DoctorAvailability } from "@/features/hospital-admin/components/DoctorAvailability";
import { Tabs } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

const TAB_VALUES = new Set(["weekly", "exceptions", "slots", "shifts", "availability"]);

function SchedulesContent() {
  const { hospitalId } = useHospitalAdmin();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") ?? "";
  const defaultTab = TAB_VALUES.has(tabParam) ? tabParam : "weekly";
  const { data: departments, isLoading, error, reload } = useAdminDepartments(hospitalId);
  const { data: doctors } = useAdminDoctors(hospitalId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !departments) {
    return <ErrorState message={error ?? "Unable to load schedules."} onRetry={reload} />;
  }

  const departmentOptions = departments.map((d) => ({ id: d.id, name: d.name }));
  const doctorOptions = (doctors ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    departmentId: d.departmentId,
  }));

  return (
    <Tabs
      key={defaultTab}
      defaultValue={defaultTab}
      tabs={[
        {
          value: "weekly",
          label: "Weekly Schedule",
          content: (
            <ScheduleEditor hospitalId={hospitalId} departments={departmentOptions} doctors={doctorOptions} />
          ),
        },
        {
          value: "exceptions",
          label: "Exceptions",
          content: <ExceptionList hospitalId={hospitalId} departments={departmentOptions} />,
        },
        {
          value: "slots",
          label: "Appointment Slots",
          content: <AppointmentSlotsEditor />,
        },
        {
          value: "shifts",
          label: "Shifts",
          content: <ShiftsEditor departments={departmentOptions} />,
        },
        {
          value: "availability",
          label: "Doctor Availability",
          content: <DoctorAvailability doctors={doctorOptions} />,
        },
      ]}
    />
  );
}

export default function SchedulesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="OPD Schedules"
        description="Weekly OPD schedule, temporary changes and appointment slot rules per department."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <SchedulesContent />
      </Suspense>
    </div>
  );
}
