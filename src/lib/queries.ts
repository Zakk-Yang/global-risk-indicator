import { prisma } from "./db";
import type {
  Driver,
  RiskCategory,
  Region,
  Indicator,
  IndicatorRegionValue,
  TimelinePoint,
  Alert,
  NetworkNode,
  NetworkEdge,
} from "./mock-data";

// =============================================================================
// Dashboard data fetchers — return shapes matching existing component props
// =============================================================================

/** Get the latest snapshot (today's GRI score + regime) */
export async function getLatestSnapshot() {
  const snap = await prisma.snapshot.findFirst({
    orderBy: { date: "desc" },
    include: {
      driverScores: true,
      categoryScores: true,
      regionScores: true,
    },
  });
  if (!snap) return null;
  return {
    current: snap.griScore,
    previous: snap.griScore - snap.griDelta,
    delta: snap.griDelta,
    regime: snap.regime,
    percentile: 78, // TODO: compute from historical distribution
    updatedAt: snap.date.toISOString(),
  };
}

/** Get all drivers with their current scores from the latest snapshot */
export async function getDrivers(): Promise<Driver[]> {
  const allDrivers = await prisma.driver.findMany({
    include: { categories: { select: { categoryId: true } } },
  });
  const latestSnap = await prisma.snapshot.findFirst({ orderBy: { date: "desc" } });
  const driverScores = latestSnap
    ? await prisma.snapshotDriverScore.findMany({ where: { snapshotId: latestSnap.id } })
    : [];
  const scoreMap = Object.fromEntries(driverScores.map((s) => [s.driverId, s]));

  return allDrivers.map((d) => ({
    id: d.id,
    name: d.name,
    score: scoreMap[d.id]?.score ?? 50,
    delta: scoreMap[d.id]?.delta ?? 0,
    color: d.color,
    categories: d.categories.map((c) => c.categoryId),
    description: d.description,
  }));
}

/** Get all risk categories with current scores */
export async function getRiskCategories(): Promise<RiskCategory[]> {
  const cats = await prisma.riskCategory.findMany({
    include: {
      indicators: { select: { id: true } },
      drivers: { select: { driverId: true } },
    },
  });
  const latestSnap = await prisma.snapshot.findFirst({ orderBy: { date: "desc" } });
  const catScores = latestSnap
    ? await prisma.snapshotCategoryScore.findMany({ where: { snapshotId: latestSnap.id } })
    : [];
  const scoreMap = Object.fromEntries(catScores.map((s) => [s.categoryId, s]));

  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    score: scoreMap[c.id]?.score ?? 50,
    delta: scoreMap[c.id]?.delta ?? 0,
    indicators: c.indicators.map((i) => i.id),
    drivers: c.drivers.map((d) => d.driverId),
  }));
}

/** Get all regions with current scores */
export async function getRegions(): Promise<Region[]> {
  const allRegions = await prisma.region.findMany();
  const latestSnap = await prisma.snapshot.findFirst({ orderBy: { date: "desc" } });
  const regionScores = latestSnap
    ? await prisma.snapshotRegionScore.findMany({ where: { snapshotId: latestSnap.id } })
    : [];
  const scoreMap = Object.fromEntries(regionScores.map((s) => [s.regionId, s]));

  // Get category scores per region from latest readings
  const latestDate = latestSnap?.date ?? new Date();
  const readings = await prisma.reading.findMany({
    where: { date: latestDate },
    include: { indicator: { select: { categoryId: true } } },
  });

  // Group readings by region → category → avg score
  const regionCatScores: Record<string, Record<string, number[]>> = {};
  for (const r of readings) {
    if (!regionCatScores[r.regionId]) regionCatScores[r.regionId] = {};
    if (!regionCatScores[r.regionId][r.indicator.categoryId]) {
      regionCatScores[r.regionId][r.indicator.categoryId] = [];
    }
    regionCatScores[r.regionId][r.indicator.categoryId].push(r.score);
  }

  // Get driver names for topDriverId lookup
  const driverNames = Object.fromEntries(
    (await prisma.driver.findMany({ select: { id: true, name: true } })).map((d) => [d.id, d.name])
  );

  return allRegions.map((reg) => {
    const catScores = regionCatScores[reg.id] ?? {};
    const categoryScores: Record<string, number> = {};
    for (const [catId, scores] of Object.entries(catScores)) {
      categoryScores[catId] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
    const snap = scoreMap[reg.id];
    return {
      id: reg.id,
      name: reg.name,
      code: reg.code,
      score: snap?.score ?? 50,
      delta: snap?.delta ?? 0,
      topDriver: driverNames[snap?.topDriverId ?? "geopolitical"] ?? "Unknown",
      categoryScores,
    };
  });
}

/** Get all indicators with their latest region readings */
export async function getIndicators(): Promise<Indicator[]> {
  const allIndicators = await prisma.indicator.findMany();
  const latestSnap = await prisma.snapshot.findFirst({ orderBy: { date: "desc" } });
  const latestDate = latestSnap?.date ?? new Date();

  const readings = await prisma.reading.findMany({
    where: { date: latestDate },
  });

  // Group readings by indicator
  const readingsByIndicator: Record<string, Record<string, IndicatorRegionValue>> = {};
  for (const r of readings) {
    if (!readingsByIndicator[r.indicatorId]) readingsByIndicator[r.indicatorId] = {};
    readingsByIndicator[r.indicatorId][r.regionId] = {
      value: r.value,
      score: r.score,
      zScore: r.zScore,
      trend: r.trend as "rising" | "falling" | "stable",
    };
  }

  return allIndicators.map((ind) => ({
    id: ind.id,
    name: ind.name,
    unit: ind.unit,
    category: ind.categoryId,
    regions: readingsByIndicator[ind.id] ?? {},
  }));
}

/** Get timeline data (all snapshots ordered by date) */
export async function getTimeline(): Promise<TimelinePoint[]> {
  const snapshots = await prisma.snapshot.findMany({
    orderBy: { date: "asc" },
    select: { date: true, griScore: true, event: true },
  });
  return snapshots.map((s) => ({
    date: s.date.toISOString().slice(0, 7), // "YYYY-MM"
    score: s.griScore,
    event: s.event ?? undefined,
  }));
}

/** Get the driver × category contribution matrix */
export async function getCategoryMatrix() {
  const allDrivers = await prisma.driver.findMany({ orderBy: { id: "asc" } });
  const allCategories = await prisma.riskCategory.findMany({ orderBy: { id: "asc" } });
  const weights = await prisma.driverCategory.findMany();

  const weightMap: Record<string, Record<string, number>> = {};
  for (const w of weights) {
    if (!weightMap[w.driverId]) weightMap[w.driverId] = {};
    weightMap[w.driverId][w.categoryId] = w.weight;
  }

  return {
    drivers: allDrivers.map((d) => d.name),
    categories: allCategories.map((c) => c.name),
    values: allDrivers.map((d) =>
      allCategories.map((c) => weightMap[d.id]?.[c.id] ?? 0)
    ),
  };
}

/** Get network graph nodes and edges */
export async function getNetworkGraph(): Promise<{
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}> {
  const allDrivers = await prisma.driver.findMany();
  const allCategories = await prisma.riskCategory.findMany();
  const latestSnap = await prisma.snapshot.findFirst({ orderBy: { date: "desc" } });

  const driverScores = latestSnap
    ? await prisma.snapshotDriverScore.findMany({ where: { snapshotId: latestSnap.id } })
    : [];
  const catScores = latestSnap
    ? await prisma.snapshotCategoryScore.findMany({ where: { snapshotId: latestSnap.id } })
    : [];

  const dScoreMap = Object.fromEntries(driverScores.map((s) => [s.driverId, s.score]));
  const cScoreMap = Object.fromEntries(catScores.map((s) => [s.categoryId, s.score]));

  const nodes: NetworkNode[] = [
    ...allDrivers.map((d) => ({
      id: `n-${d.id}`,
      label: d.name,
      type: "driver" as const,
      score: dScoreMap[d.id] ?? 50,
    })),
    ...allCategories.map((c) => ({
      id: `n-${c.id}`,
      label: c.name,
      type: "category" as const,
      score: cScoreMap[c.id] ?? 50,
    })),
  ];

  // Build edges from driver-category weights
  const weights = await prisma.driverCategory.findMany({
    where: { weight: { gt: 30 } }, // Only show meaningful connections
  });

  const edges: NetworkEdge[] = weights.map((w) => ({
    source: `n-${w.driverId}`,
    target: `n-${w.categoryId}`,
    weight: w.weight / 100, // Normalize to 0-1
  }));

  return { nodes, edges };
}

/** Get active alerts with news */
export async function getAlerts(): Promise<Alert[]> {
  const dbAlerts = await prisma.alert.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    include: { news: { orderBy: { publishedAt: "desc" } } },
  });

  return dbAlerts.map((a) => ({
    id: a.id,
    severity: a.severity as "critical" | "warning" | "info",
    title: a.title,
    description: a.description,
    timestamp: a.createdAt.toISOString(),
    drivers: a.drivers,
    probability: a.probability ?? undefined,
    news: a.news.map((n) => ({
      title: n.title,
      source: n.source,
      url: n.url,
      timestamp: n.publishedAt.toISOString(),
    })),
  }));
}

// =============================================================================
// Full dashboard payload — single fetch for the entire page
// =============================================================================

export async function getDashboardData() {
  const [
    globalRiskScore,
    drivers,
    riskCategories,
    regions,
    indicators,
    timeline,
    categoryMatrix,
    networkGraph,
    alerts,
  ] = await Promise.all([
    getLatestSnapshot(),
    getDrivers(),
    getRiskCategories(),
    getRegions(),
    getIndicators(),
    getTimeline(),
    getCategoryMatrix(),
    getNetworkGraph(),
    getAlerts(),
  ]);

  return {
    globalRiskScore,
    drivers,
    riskCategories,
    regions,
    indicators,
    timeline,
    categoryMatrix,
    networkNodes: networkGraph.nodes,
    networkEdges: networkGraph.edges,
    alerts,
  };
}
