import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/get-data";

export const revalidate = 300; // Revalidate every 5 minutes

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
