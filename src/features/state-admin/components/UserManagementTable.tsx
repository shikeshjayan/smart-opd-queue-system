"use client";

import { useAsync } from "@/lib/use-async";
import { getUsers } from "@/server/actions/state-admin";
import { getDistrictName } from "@/config/districts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";

function formatLastLogin(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function UserManagementTable() {
  const { data, isLoading, error, reload } = useAsync(() => getUsers(), []);

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Could not load users"} onRetry={reload} />;
  }

  return (
    <div className="rounded-card border border-ink-200 bg-surface shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center">
                  <EmptyState title="No users found" description="No user accounts are available." />
                </TableCell>
              </TableRow>
            ) : (
              data.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-ink-900">{user.name}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.districtId ? getDistrictName(user.districtId) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "success" : "default"}>
                      {user.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-ink-500">{formatLastLogin(user.lastLogin)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
