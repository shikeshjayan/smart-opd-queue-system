"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useHospitalDetail } from "@/features/government-admin/hooks/useGovernmentAdmin";
import { HospitalSummary } from "@/features/government-admin/components/HospitalSummary";
import { QueueOverview } from "@/features/government-admin/components/QueueOverview";
import { OpdStatusBadge } from "@/features/opd/components/OpdStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { formatTime } from "@/features/hospital-admin/utils/format";

export default function HospitalDetailPage() {
  const params = useParams<{ hospitalId: string }>();
  const hospitalId = params.hospitalId;
  const { data, isLoading, error, reload } = useHospitalDetail(hospitalId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Hospital not found."} onRetry={reload} />;
  }

  const { hospital, departments, opds, doctors, queues } = data;

  return (
    <div className="flex flex-col gap-6">
      <HospitalSummary detail={data} />

      <Tabs
        defaultValue="overview"
        tabs={[
          {
            value: "overview",
            label: "Overview",
            content: (
              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Departments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="hidden md:block">
                      <div className="overflow-hidden rounded-card border border-ink-200">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-surface-muted hover:bg-surface-muted">
                              <TableHead>Department</TableHead>
                              <TableHead className="text-right">Waiting</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {departments.map(({ department, waiting }) => (
                              <TableRow key={department.id}>
                                <TableCell className="font-medium text-ink-900">
                                  {department.name}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-ink-900">
                                  {waiting}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={department.status === "active" ? "success" : "default"}
                                  >
                                    {department.status === "active" ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    <ul className="flex flex-col gap-2 md:hidden">
                      {departments.map(({ department, waiting }) => (
                        <li
                          key={department.id}
                          className="flex items-center justify-between rounded-card border border-ink-200 p-3"
                        >
                          <span className="font-medium text-ink-900">{department.name}</span>
                          <span className="text-sm text-ink-700">{waiting} waiting</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Doctors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col gap-2">
                      {doctors.map((doctor) => (
                        <li
                          key={doctor.id}
                          className="flex items-center justify-between rounded-card border border-ink-200 p-3"
                        >
                          <div>
                            <p className="font-medium text-ink-900">{doctor.name}</p>
                            <p className="text-sm text-ink-500">{doctor.speciality}</p>
                          </div>
                          <Badge variant={doctor.status === "active" ? "success" : "default"}>
                            {doctor.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            value: "departments",
            label: "Departments",
            content: (
              <div className="hidden md:block">
                <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-surface-muted hover:bg-surface-muted">
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Waiting</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments.map(({ department, waiting }) => (
                        <TableRow key={department.id}>
                          <TableCell className="font-medium text-ink-900">
                            {department.name}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-ink-900">
                            {waiting}
                          </TableCell>
                          <TableCell>
                            <Badge variant={department.status === "active" ? "success" : "default"}>
                              {department.status === "active" ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ),
          },
          {
            value: "opds",
            label: "OPDs",
            content: (
              <div className="hidden md:block">
                <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-surface-muted hover:bg-surface-muted">
                        <TableHead>OPD</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Now Serving</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {opds.map((opd) => {
                        const department = departments.find(
                          (d) => d.department.id === opd.departmentId
                        );
                        return (
                          <TableRow key={opd.id}>
                            <TableCell className="font-medium text-ink-900">{opd.name}</TableCell>
                            <TableCell className="text-ink-700">
                              {department?.department.name ?? "—"}
                            </TableCell>
                            <TableCell className="text-ink-700">
                              {formatTime(opd.startTime)} – {formatTime(opd.endTime)}
                            </TableCell>
                            <TableCell>
                              <OpdStatusBadge status={opd.status} />
                            </TableCell>
                            <TableCell className="text-right text-ink-700">
                              {opd.currentlyServing ?? "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ),
          },
          {
            value: "queues",
            label: "Queues",
            content: <QueueOverview items={queues} scope="district" />,
          },
          {
            value: "doctors",
            label: "Doctors",
            content: (
              <div className="hidden md:block">
                <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-surface-muted hover:bg-surface-muted">
                        <TableHead>Doctor</TableHead>
                        <TableHead>Speciality</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doctors.map((doctor) => (
                        <TableRow key={doctor.id}>
                          <TableCell className="font-medium text-ink-900">{doctor.name}</TableCell>
                          <TableCell className="text-ink-700">{doctor.speciality}</TableCell>
                          <TableCell>
                            <Badge variant={doctor.status === "active" ? "success" : "default"}>
                              {doctor.status === "active" ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ),
          },
          {
            value: "reports",
            label: "Reports",
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>{hospital.name} Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-ink-500">
                    Generate operational reports for this hospital from the district reports page.
                  </p>
                  <Link
                    href="/district-admin/reports"
                    className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
                  >
                    Open District Reports
                  </Link>
                </CardContent>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
