import { getDashboardData } from "@/lib/get-data";
import DashboardClient from "./DashboardClient";

export default async function Dashboard() {
  const data = await getDashboardData();
  return <DashboardClient data={data} />;
}
