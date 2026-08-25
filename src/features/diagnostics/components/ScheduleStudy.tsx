import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ScheduleStudy({ orderId }: { orderId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Diagnostic Study</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Order ID: {orderId}</p>
        <Button className="mt-4">Confirm Slot</Button>
      </CardContent>
    </Card>
  );
}
