import { useAsync } from "@/lib/use-async";
import { getPharmacyDashboard, getLowStockAlerts, getExpiringAlerts, getInventorySummary } from "@/server/actions/pharmacy";

export function usePharmacyDashboard(hospitalId?: string) {
  const fetchAll = useAsync(
    async () => {
      const [stats, lowStock, expiring, inventory] = await Promise.all([
        getPharmacyDashboard(hospitalId),
        getLowStockAlerts(hospitalId),
        getExpiringAlerts(hospitalId),
        getInventorySummary(hospitalId),
      ]);
      return { stats, lowStock, expiring, inventory };
    },
    [hospitalId]
  );
  return fetchAll;
}