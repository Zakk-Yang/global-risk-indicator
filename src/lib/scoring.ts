// =============================================================================
// GRI Scoring Engine — Pure functions, no DB dependency
// Architecture: Raw Values → Scores → Categories → Drivers → GRI
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface IndicatorConfig {
  id: string;
  categoryId: string;
  min: number;
  max: number;
  inverted?: boolean; // lower raw value = higher risk (GDP, PMI, confidence, etc.)
  symmetric?: boolean; // deviation from safe center = risk (credit-growth, house-price)
  safeCenter?: number; // center for symmetric indicators
  historicalMean: number;
  historicalStdDev: number;
  regionOverrides?: Record<string, Partial<Pick<IndicatorConfig, "historicalMean" | "historicalStdDev">>>;
}

export interface ReadingInput {
  indicatorId: string;
  regionId: string;
  value: number;
}

export interface ScoredReading extends ReadingInput {
  score: number;
  zScore: number;
  trend: "rising" | "falling" | "stable";
}

export interface CategoryScore {
  categoryId: string;
  score: number;
  delta: number;
}

export interface DriverScore {
  driverId: string;
  score: number;
  delta: number;
}

export interface RegionScore {
  regionId: string;
  score: number;
  delta: number;
  topDriverId: string;
}

export interface Snapshot {
  griScore: number;
  griDelta: number;
  regime: string;
  driverScores: DriverScore[];
  categoryScores: CategoryScore[];
  regionScores: RegionScore[];
}

// -----------------------------------------------------------------------------
// Indicator Configuration Registry (21 indicators)
// -----------------------------------------------------------------------------

export const INDICATOR_CONFIGS: IndicatorConfig[] = [
  // === Inflation Pressure ===
  {
    id: "cpi", categoryId: "inflation",
    min: -1, max: 12, inverted: false,
    historicalMean: 2.5, historicalStdDev: 1.5,
  },
  {
    id: "energy-price", categoryId: "inflation",
    min: 60, max: 200, inverted: false,
    historicalMean: 100, historicalStdDev: 25,
  },
  {
    id: "food-price", categoryId: "inflation",
    min: 80, max: 160, inverted: false,
    historicalMean: 100, historicalStdDev: 15,
  },
  {
    id: "wage-growth", categoryId: "inflation",
    min: 0, max: 10, inverted: false,
    historicalMean: 3.0, historicalStdDev: 1.2,
  },

  // === Credit & Liquidity Stress ===
  {
    id: "credit-growth", categoryId: "credit-liquidity",
    min: -5, max: 20, symmetric: true, safeCenter: 4.0,
    historicalMean: 4.0, historicalStdDev: 3.0,
  },
  {
    id: "house-price", categoryId: "credit-liquidity",
    min: -15, max: 20, symmetric: true, safeCenter: 3.0,
    historicalMean: 3.0, historicalStdDev: 4.0,
  },
  {
    id: "bond-yield-10y", categoryId: "credit-liquidity",
    min: -0.5, max: 10, inverted: false,
    historicalMean: 3.0, historicalStdDev: 1.5,
    regionOverrides: {
      japan: { historicalMean: 0.5, historicalStdDev: 0.5 },
    },
  },
  {
    id: "govt-debt-gdp", categoryId: "credit-liquidity",
    min: 10, max: 300, inverted: false,
    historicalMean: 80, historicalStdDev: 30,
    regionOverrides: {
      japan: { historicalMean: 230, historicalStdDev: 20 },
    },
  },
  {
    id: "policy-rate", categoryId: "credit-liquidity",
    min: -0.5, max: 15, inverted: false,
    historicalMean: 3.0, historicalStdDev: 2.0,
    regionOverrides: {
      japan: { historicalMean: 0.1, historicalStdDev: 0.3 },
    },
  },

  // === Macro Slowdown ===
  {
    id: "gdp-growth", categoryId: "macro-slowdown",
    min: -5, max: 10, inverted: true,
    historicalMean: 2.5, historicalStdDev: 1.5,
    regionOverrides: {
      china: { historicalMean: 6.0, historicalStdDev: 1.5 },
    },
  },
  {
    id: "pmi-manufacturing", categoryId: "macro-slowdown",
    min: 35, max: 65, inverted: true,
    historicalMean: 50, historicalStdDev: 3.0,
  },
  {
    id: "industrial-production", categoryId: "macro-slowdown",
    min: -10, max: 10, inverted: true,
    historicalMean: 1.5, historicalStdDev: 3.0,
  },
  {
    id: "trade-balance", categoryId: "macro-slowdown",
    min: -8, max: 12, inverted: true,
    historicalMean: 0, historicalStdDev: 3.0,
  },
  {
    id: "business-confidence", categoryId: "macro-slowdown",
    min: 85, max: 115, inverted: true,
    historicalMean: 100, historicalStdDev: 4.0,
  },

  // === Labor & Consumption Stress ===
  {
    id: "unemployment", categoryId: "labor-consumption",
    min: 1, max: 15, inverted: false,
    historicalMean: 5.5, historicalStdDev: 2.0,
  },
  {
    id: "consumer-confidence", categoryId: "labor-consumption",
    min: 75, max: 115, inverted: true,
    historicalMean: 100, historicalStdDev: 5.0,
  },
  {
    id: "retail-sales", categoryId: "labor-consumption",
    min: -5, max: 10, inverted: true,
    historicalMean: 3.0, historicalStdDev: 2.0,
  },

  // === Financial Market Stress ===
  {
    id: "stock-market", categoryId: "financial-market",
    min: -40, max: 5, inverted: true,
    historicalMean: -2.0, historicalStdDev: 8.0,
  },
  {
    id: "exchange-rate", categoryId: "financial-market",
    min: -20, max: 10, inverted: true,
    historicalMean: 0, historicalStdDev: 5.0,
  },
  {
    id: "foreign-reserves", categoryId: "financial-market",
    min: -10, max: 5, inverted: true,
    historicalMean: 0.5, historicalStdDev: 2.0,
  },
  {
    id: "current-account", categoryId: "financial-market",
    min: -8, max: 10, inverted: true,
    historicalMean: 0, historicalStdDev: 3.0,
  },
];

// Indexed lookup
const configById = new Map(INDICATOR_CONFIGS.map((c) => [c.id, c]));

export function getIndicatorConfig(indicatorId: string): IndicatorConfig {
  const cfg = configById.get(indicatorId);
  if (!cfg) throw new Error(`Unknown indicator: ${indicatorId}`);
  return cfg;
}

// Category IDs
const CATEGORY_IDS = [
  "inflation",
  "credit-liquidity",
  "macro-slowdown",
  "labor-consumption",
  "financial-market",
] as const;

// Driver IDs
const DRIVER_IDS = [
  "geopolitical",
  "ai-disruption",
  "energy-shock",
  "monetary",
  "financial-risks",
] as const;

// Region IDs
const REGION_IDS = ["us", "europe", "china", "em", "japan", "mideast"] as const;

// -----------------------------------------------------------------------------
// Layer 1: Normalize a single reading → score (0-100) + zScore
// -----------------------------------------------------------------------------

export function normalizeReading(
  indicatorId: string,
  regionId: string,
  value: number
): { score: number; zScore: number } {
  const cfg = getIndicatorConfig(indicatorId);

  // Get region-specific mean/stdDev if available
  const overrides = cfg.regionOverrides?.[regionId];
  const mean = overrides?.historicalMean ?? cfg.historicalMean;
  const stdDev = overrides?.historicalStdDev ?? cfg.historicalStdDev;

  // Z-score
  const zScore = stdDev > 0 ? (value - mean) / stdDev : 0;

  // Score (0-100)
  let score: number;
  if (cfg.symmetric) {
    const safeCenter = cfg.safeCenter ?? cfg.historicalMean;
    const maxDistance = Math.max(
      Math.abs(cfg.max - safeCenter),
      Math.abs(cfg.min - safeCenter)
    );
    score = maxDistance > 0
      ? (Math.abs(value - safeCenter) / maxDistance) * 100
      : 50;
  } else if (cfg.inverted) {
    // Lower value = higher risk
    score = cfg.max !== cfg.min
      ? (1 - (value - cfg.min) / (cfg.max - cfg.min)) * 100
      : 50;
  } else {
    // Higher value = higher risk
    score = cfg.max !== cfg.min
      ? ((value - cfg.min) / (cfg.max - cfg.min)) * 100
      : 50;
  }

  return {
    score: clamp(Math.round(score), 0, 100),
    zScore: clampZ(parseFloat(zScore.toFixed(2))),
  };
}

// -----------------------------------------------------------------------------
// Trend: compare current vs previous month
// -----------------------------------------------------------------------------

export function computeTrend(
  current: number,
  previous: number | undefined
): "rising" | "falling" | "stable" {
  if (previous === undefined) return "stable";
  if (previous === 0) return current > 0 ? "rising" : current < 0 ? "falling" : "stable";
  const pctChange = ((current - previous) / Math.abs(previous)) * 100;
  if (pctChange > 2) return "rising";
  if (pctChange < -2) return "falling";
  return "stable";
}

// -----------------------------------------------------------------------------
// Layer 2: Category scores — average of indicator scores in that category
// -----------------------------------------------------------------------------

export function computeCategoryScores(
  readings: ScoredReading[],
  previousCategoryScores?: Map<string, number>
): CategoryScore[] {
  const categoryScoreArrays = new Map<string, number[]>();
  for (const catId of CATEGORY_IDS) {
    categoryScoreArrays.set(catId, []);
  }

  for (const r of readings) {
    const cfg = configById.get(r.indicatorId);
    if (!cfg) continue;
    categoryScoreArrays.get(cfg.categoryId)?.push(r.score);
  }

  return CATEGORY_IDS.map((catId) => {
    const scores = categoryScoreArrays.get(catId) ?? [];
    const score = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 50;
    const prev = previousCategoryScores?.get(catId) ?? score;
    return { categoryId: catId, score, delta: score - prev };
  });
}

// -----------------------------------------------------------------------------
// Layer 3: Driver scores — weighted average using driver_category_weights
// -----------------------------------------------------------------------------

export type WeightMatrix = Array<{
  driverId: string;
  categoryId: string;
  weight: number;
}>;

export function computeDriverScores(
  categoryScores: CategoryScore[],
  weights: WeightMatrix,
  previousDriverScores?: Map<string, number>
): DriverScore[] {
  const catScoreMap = new Map(categoryScores.map((c) => [c.categoryId, c.score]));

  return DRIVER_IDS.map((driverId) => {
    const driverWeights = weights.filter((w) => w.driverId === driverId);
    let totalWeight = 0;
    let weightedSum = 0;
    for (const w of driverWeights) {
      const catScore = catScoreMap.get(w.categoryId) ?? 50;
      weightedSum += w.weight * catScore;
      totalWeight += w.weight;
    }
    const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
    const prev = previousDriverScores?.get(driverId) ?? score;
    return { driverId, score, delta: score - prev };
  });
}

// -----------------------------------------------------------------------------
// Layer 4: GRI — equal-weighted average of 5 driver scores
// -----------------------------------------------------------------------------

export function computeGRI(driverScores: DriverScore[]): number {
  if (driverScores.length === 0) return 50;
  const sum = driverScores.reduce((a, d) => a + d.score, 0);
  return Math.round(sum / driverScores.length);
}

// -----------------------------------------------------------------------------
// Regime classification
// -----------------------------------------------------------------------------

export function classifyRegime(score: number): string {
  if (score >= 80) return "Critical";
  if (score >= 65) return "High Risk";
  if (score >= 50) return "Elevated Risk";
  if (score >= 35) return "Moderate";
  return "Low Risk";
}

// -----------------------------------------------------------------------------
// Layer 5: Region scores — avg of all indicator scores in that region
// -----------------------------------------------------------------------------

export function computeRegionScores(
  readings: ScoredReading[],
  weights: WeightMatrix,
  previousRegionScores?: Map<string, number>
): RegionScore[] {
  return REGION_IDS.map((regionId) => {
    const regionReadings = readings.filter((r) => r.regionId === regionId);

    // Region score = average of all indicator scores in that region
    const score = regionReadings.length > 0
      ? Math.round(
          regionReadings.reduce((a, r) => a + r.score, 0) / regionReadings.length
        )
      : 50;

    // Compute per-category scores for this region
    const catScoreArrays = new Map<string, number[]>();
    for (const r of regionReadings) {
      const cfg = configById.get(r.indicatorId);
      if (!cfg) continue;
      if (!catScoreArrays.has(cfg.categoryId)) catScoreArrays.set(cfg.categoryId, []);
      catScoreArrays.get(cfg.categoryId)!.push(r.score);
    }
    const catScores: CategoryScore[] = CATEGORY_IDS.map((catId) => {
      const scores = catScoreArrays.get(catId) ?? [];
      return {
        categoryId: catId,
        score: scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 50,
        delta: 0,
      };
    });

    // Compute driver scores for this region and find the highest
    const driverScores = computeDriverScores(catScores, weights);
    const topDriver = driverScores.reduce(
      (best, d) => (d.score > best.score ? d : best),
      driverScores[0]
    );

    const prev = previousRegionScores?.get(regionId) ?? score;
    return {
      regionId,
      score,
      delta: score - prev,
      topDriverId: topDriver.driverId,
    };
  });
}

// -----------------------------------------------------------------------------
// Full snapshot computation — orchestrates all layers
// -----------------------------------------------------------------------------

export function computeSnapshot(
  readings: ScoredReading[],
  weights: WeightMatrix,
  previous?: Snapshot | null
): Snapshot {
  const prevCatScores = previous
    ? new Map(previous.categoryScores.map((c) => [c.categoryId, c.score]))
    : undefined;
  const prevDriverScores = previous
    ? new Map(previous.driverScores.map((d) => [d.driverId, d.score]))
    : undefined;
  const prevRegionScores = previous
    ? new Map(previous.regionScores.map((r) => [r.regionId, r.score]))
    : undefined;

  const categoryScores = computeCategoryScores(readings, prevCatScores);
  const driverScores = computeDriverScores(categoryScores, weights, prevDriverScores);
  const griScore = computeGRI(driverScores);
  const griDelta = previous ? griScore - previous.griScore : 0;
  const regime = classifyRegime(griScore);
  const regionScores = computeRegionScores(readings, weights, prevRegionScores);

  return { griScore, griDelta, regime, driverScores, categoryScores, regionScores };
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampZ(z: number): number {
  return Math.max(-3, Math.min(3, z));
}
