import * as mockData from "./mock-data";

/**
 * Returns dashboard data from DB if DATABASE_URL is configured,
 * otherwise falls back to mock data. This lets the app run in both
 * modes: full production with a real DB, or demo mode with static data.
 */
export async function getDashboardData() {
  if (process.env.DATABASE_URL) {
    try {
      const { getDashboardData: fromDb } = await import("./queries");
      const data = await fromDb();
      if (data.globalRiskScore) return data;
    } catch (e) {
      console.warn("DB fetch failed, falling back to mock data:", e);
    }
  }

  // Fallback: mock data (works without any DB)
  return {
    globalRiskScore: mockData.globalRiskScore,
    drivers: mockData.drivers,
    riskCategories: mockData.riskCategories,
    regions: mockData.regions,
    indicators: mockData.indicators,
    timeline: mockData.timeline,
    categoryMatrix: mockData.categoryMatrix,
    networkNodes: mockData.networkNodes,
    networkEdges: mockData.networkEdges,
    alerts: mockData.alerts,
  };
}
