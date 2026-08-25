import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePharmacyQueue, usePharmacyActions } from "../hooks/usePharmacyQueue";

export function PrescriptionQueue() {
  const { data: queue, isLoading } = usePharmacyQueue();
  const { run } = usePharmacyActions();

  if (isLoading) return <div>Loading...</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Prescription ID</TableHead>
          <TableHead>Patient</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {queue?.map((entry) => (
          <TableRow key={entry.prescriptionId}>
            <TableCell>{entry.prescriptionId}</TableCell>
            <TableCell>{entry.patientName}</TableCell>
            <TableCell>{entry.status}</TableCell>
            <TableCell>
              <Button size="sm" onClick={() => run("dispense", entry.prescriptionId)}>
                Dispense
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}