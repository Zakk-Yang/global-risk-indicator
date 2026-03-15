import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  INDICATOR_CONFIGS,
  normalizeReading,
  computeTrend,
  computeSnapshot,
  type ScoredReading,
  type Snapshot,
  type WeightMatrix,
} from "../src/lib/scoring";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// =============================================================================
// Deterministic PRNG — mulberry32
// =============================================================================

function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

/** Box-Muller transform for gaussian random numbers */
function gaussian(): number {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = rand();
  while (u2 === 0) u2 = rand();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

// =============================================================================
// Reference Data — mirrors existing seed definitions
// =============================================================================

const drivers = [
  { id: "geopolitical", name: "Geopolitical Conflict", color: "#ef4444", description: "Wars, sanctions, territorial disputes, and political instability" },
  { id: "ai-disruption", name: "AI / Tech Disruption", color: "#8b5cf6", description: "Automation displacement, AI capex cycles, tech concentration" },
  { id: "energy-shock", name: "Energy Supply Shock", color: "#f59e0b", description: "Oil/gas supply disruptions, energy transition shocks" },
  { id: "monetary", name: "Monetary Tightening", color: "#3b82f6", description: "Central bank rate hikes, quantitative tightening, policy divergence" },
  { id: "financial-risks", name: "Financial Risks", color: "#ec4899", description: "Asset bubbles, fiscal deficits, sovereign debt, systemic leverage" },
];

const riskCategories = [
  { id: "inflation", name: "Inflation Pressure" },
  { id: "credit-liquidity", name: "Credit & Liquidity Stress" },
  { id: "macro-slowdown", name: "Macro Slowdown" },
  { id: "labor-consumption", name: "Labor & Consumption Stress" },
  { id: "financial-market", name: "Financial Market Stress" },
];

const regions = [
  { id: "us", name: "United States", code: "US", type: "COUNTRY", iso2: "US", iso3: "USA" },
  { id: "europe", name: "Europe", code: "EU", type: "REGION", iso2: null, iso3: null },
  { id: "china", name: "China", code: "CN", type: "COUNTRY", iso2: "CN", iso3: "CHN" },
  { id: "em", name: "Emerging Markets", code: "EM", type: "BASKET", iso2: null, iso3: null },
  { id: "japan", name: "Japan", code: "JP", type: "COUNTRY", iso2: "JP", iso3: "JPN" },
  { id: "mideast", name: "Middle East", code: "ME", type: "REGION", iso2: null, iso3: null },
];

const indicatorDefs = [
  { id: "cpi", name: "CPI Inflation (YoY)", unit: "%", categoryId: "inflation", frequency: "monthly", source: "FRED", sourceCode: "CPIAUCSL", sourceUrl: "https://fred.stlouisfed.org/series/CPIAUCSL" },
  { id: "energy-price", name: "Energy Price Index", unit: "idx", categoryId: "inflation", frequency: "daily", source: "FRED", sourceCode: "DCOILWTICO", sourceUrl: "https://fred.stlouisfed.org/series/DCOILWTICO" },
  { id: "food-price", name: "Food Price Index", unit: "idx", categoryId: "inflation", frequency: "monthly", source: "FAO", sourceCode: "FFPI", sourceUrl: "https://www.fao.org/worldfoodsituation/foodpricesindex" },
  { id: "wage-growth", name: "Wage Growth (YoY)", unit: "%", categoryId: "inflation", frequency: "monthly", source: "FRED", sourceCode: "CES0500000003", sourceUrl: "https://fred.stlouisfed.org/series/CES0500000003" },
  { id: "credit-growth", name: "Credit Growth (YoY)", unit: "%", categoryId: "credit-liquidity", frequency: "quarterly", source: "BIS", sourceCode: "TOTAL_CREDIT", sourceUrl: "https://www.bis.org/statistics/totcredit.htm" },
  { id: "house-price", name: "House Price Index (YoY)", unit: "%", categoryId: "credit-liquidity", frequency: "quarterly", source: "BIS", sourceCode: "REAL_PROPERTY", sourceUrl: "https://www.bis.org/statistics/pp.htm" },
  { id: "bond-yield-10y", name: "10Y Government Bond Yield", unit: "%", categoryId: "credit-liquidity", frequency: "daily", source: "FRED", sourceCode: "DGS10", sourceUrl: "https://fred.stlouisfed.org/series/DGS10" },
  { id: "govt-debt-gdp", name: "Government Debt / GDP", unit: "%", categoryId: "credit-liquidity", frequency: "quarterly", source: "IMF", sourceCode: "GGGD_NGDP", sourceUrl: "https://www.imf.org/external/datamapper/GGGD_NGDP@WEO" },
  { id: "policy-rate", name: "Policy Interest Rate", unit: "%", categoryId: "credit-liquidity", frequency: "monthly", source: "BIS", sourceCode: "POLICY_RATE", sourceUrl: "https://www.bis.org/statistics/cbpol.htm" },
  { id: "gdp-growth", name: "GDP Growth (YoY)", unit: "%", categoryId: "macro-slowdown", frequency: "quarterly", source: "OECD", sourceCode: "QNA_GDP", sourceUrl: "https://stats.oecd.org/Index.aspx?DataSetCode=QNA" },
  { id: "pmi-manufacturing", name: "PMI Manufacturing", unit: "idx", categoryId: "macro-slowdown", frequency: "monthly", source: "S&P Global", sourceCode: "PMI_MFG", sourceUrl: "https://www.pmi.spglobal.com" },
  { id: "industrial-production", name: "Industrial Production (YoY)", unit: "%", categoryId: "macro-slowdown", frequency: "monthly", source: "FRED", sourceCode: "INDPRO", sourceUrl: "https://fred.stlouisfed.org/series/INDPRO" },
  { id: "trade-balance", name: "Trade Balance (% GDP)", unit: "%", categoryId: "macro-slowdown", frequency: "quarterly", source: "OECD", sourceCode: "TRADE_BAL", sourceUrl: "https://stats.oecd.org/Index.aspx?DataSetCode=MEI_TRD" },
  { id: "business-confidence", name: "Business Confidence Index", unit: "idx", categoryId: "macro-slowdown", frequency: "monthly", source: "OECD", sourceCode: "BCI", sourceUrl: "https://stats.oecd.org/Index.aspx?DataSetCode=MEI_CLI" },
  { id: "unemployment", name: "Unemployment Rate", unit: "%", categoryId: "labor-consumption", frequency: "monthly", source: "FRED", sourceCode: "UNRATE", sourceUrl: "https://fred.stlouisfed.org/series/UNRATE" },
  { id: "consumer-confidence", name: "Consumer Confidence Index", unit: "idx", categoryId: "labor-consumption", frequency: "monthly", source: "OECD", sourceCode: "CCI", sourceUrl: "https://stats.oecd.org/Index.aspx?DataSetCode=MEI_CLI" },
  { id: "retail-sales", name: "Retail Sales (YoY)", unit: "%", categoryId: "labor-consumption", frequency: "monthly", source: "FRED", sourceCode: "RSXFS", sourceUrl: "https://fred.stlouisfed.org/series/RSXFS" },
  { id: "stock-market", name: "Stock Market Drawdown", unit: "%", categoryId: "financial-market", frequency: "daily", source: "Yahoo Finance", sourceCode: "^GSPC", sourceUrl: "https://finance.yahoo.com/quote/%5EGSPC" },
  { id: "exchange-rate", name: "Exchange Rate vs USD (YoY)", unit: "%", categoryId: "financial-market", frequency: "daily", source: "FRED", sourceCode: "DTWEXBGS", sourceUrl: "https://fred.stlouisfed.org/series/DTWEXBGS" },
  { id: "foreign-reserves", name: "Foreign Reserves (3m change)", unit: "%", categoryId: "financial-market", frequency: "monthly", source: "IMF", sourceCode: "COFER", sourceUrl: "https://data.imf.org/?sk=E6A5F467-C14B-4AA8-9F6D-5A09EC4E62A4" },
  { id: "current-account", name: "Current Account (% GDP)", unit: "%", categoryId: "financial-market", frequency: "quarterly", source: "IMF", sourceCode: "BCA_NGDPD", sourceUrl: "https://www.imf.org/external/datamapper/BCA_NGDPD@WEO" },
];

const driverCategoryWeights: WeightMatrix = [
  { driverId: "geopolitical", categoryId: "inflation", weight: 68 },
  { driverId: "geopolitical", categoryId: "credit-liquidity", weight: 32 },
  { driverId: "geopolitical", categoryId: "macro-slowdown", weight: 62 },
  { driverId: "geopolitical", categoryId: "labor-consumption", weight: 28 },
  { driverId: "geopolitical", categoryId: "financial-market", weight: 72 },
  { driverId: "ai-disruption", categoryId: "inflation", weight: 25 },
  { driverId: "ai-disruption", categoryId: "credit-liquidity", weight: 35 },
  { driverId: "ai-disruption", categoryId: "macro-slowdown", weight: 30 },
  { driverId: "ai-disruption", categoryId: "labor-consumption", weight: 75 },
  { driverId: "ai-disruption", categoryId: "financial-market", weight: 68 },
  { driverId: "energy-shock", categoryId: "inflation", weight: 78 },
  { driverId: "energy-shock", categoryId: "credit-liquidity", weight: 28 },
  { driverId: "energy-shock", categoryId: "macro-slowdown", weight: 58 },
  { driverId: "energy-shock", categoryId: "labor-consumption", weight: 22 },
  { driverId: "energy-shock", categoryId: "financial-market", weight: 55 },
  { driverId: "monetary", categoryId: "inflation", weight: 52 },
  { driverId: "monetary", categoryId: "credit-liquidity", weight: 75 },
  { driverId: "monetary", categoryId: "macro-slowdown", weight: 38 },
  { driverId: "monetary", categoryId: "labor-consumption", weight: 30 },
  { driverId: "monetary", categoryId: "financial-market", weight: 62 },
  { driverId: "financial-risks", categoryId: "inflation", weight: 35 },
  { driverId: "financial-risks", categoryId: "credit-liquidity", weight: 72 },
  { driverId: "financial-risks", categoryId: "macro-slowdown", weight: 58 },
  { driverId: "financial-risks", categoryId: "labor-consumption", weight: 25 },
  { driverId: "financial-risks", categoryId: "financial-market", weight: 65 },
];

// =============================================================================
// Region Base Values (April 2024 starting points — realistic per-region)
// =============================================================================

// base[indicatorId][regionId] = starting value for April 2024
const BASE_VALUES: Record<string, Record<string, number>> = {
  // Inflation Pressure
  "cpi":                  { us: 3.1, europe: 2.8, china: 0.3,  em: 5.5,  japan: 2.2, mideast: 3.8 },
  "energy-price":         { us: 95,  europe: 105, china: 90,   em: 100,  japan: 100, mideast: 80  },
  "food-price":           { us: 100, europe: 102, china: 98,   em: 110,  japan: 101, mideast: 108 },
  "wage-growth":          { us: 4.5, europe: 3.5, china: 5.5,  em: 6.0,  japan: 2.0, mideast: 3.0 },
  // Credit & Liquidity
  "credit-growth":        { us: 2.8, europe: 1.5, china: 8.0,  em: 5.0,  japan: 1.8, mideast: 3.5 },
  "house-price":          { us: 4.5, europe: 2.8, china: -1.0, em: 3.5,  japan: 5.0, mideast: 6.0 },
  "bond-yield-10y":       { us: 4.2, europe: 2.4, china: 2.5,  em: 6.5,  japan: 0.8, mideast: 4.5 },
  "govt-debt-gdp":        { us: 120, europe: 85,  china: 78,   em: 55,   japan: 250, mideast: 40  },
  "policy-rate":          { us: 5.25,europe: 4.0, china: 3.65, em: 9.0,  japan: 0.1, mideast: 5.5 },
  // Macro Slowdown
  "gdp-growth":           { us: 2.8, europe: 1.2, china: 5.2,  em: 4.0,  japan: 1.5, mideast: 3.5 },
  "pmi-manufacturing":    { us: 51.0,europe: 48.5,china: 50.5, em: 51.5, japan: 50.0,mideast: 52.5 },
  "industrial-production":{ us: 1.0, europe: -0.5,china: 5.5,  em: 3.0,  japan: 0.5, mideast: 4.0 },
  "trade-balance":        { us: -2.8,europe: 2.5, china: 3.0,  em: -0.8, japan: 0.2, mideast: 10.0},
  "business-confidence":  { us: 101, europe: 98,  china: 100,  em: 101,  japan: 99,  mideast: 103 },
  // Labor & Consumption
  "unemployment":         { us: 3.8, europe: 6.2, china: 5.0,  em: 7.2,  japan: 2.5, mideast: 9.0 },
  "consumer-confidence":  { us: 102, europe: 97,  china: 98,   em: 101,  japan: 99,  mideast: 95  },
  "retail-sales":         { us: 3.5, europe: 2.0, china: 5.0,  em: 5.0,  japan: 2.5, mideast: 4.0 },
  // Financial Market
  "stock-market":         { us: -2.0,europe: -3.0,china: -5.0, em: -3.5, japan: -1.5,mideast: -4.0},
  "exchange-rate":        { us: 0,   europe: -1.0,china: -1.5, em: -3.0, japan: -3.0,mideast: -0.5},
  "foreign-reserves":     { us: 0.5, europe: 0.2, china: -0.5, em: -1.0, japan: 0.0, mideast: 0.5 },
  "current-account":      { us: -3.0,europe: 2.5, china: 2.0,  em: -1.5, japan: 3.8, mideast: 7.0 },
};

// =============================================================================
// Per-indicator monthly volatility
// =============================================================================

const VOLATILITY: Record<string, number> = {
  "cpi": 0.15,
  "energy-price": 5.0,
  "food-price": 2.0,
  "wage-growth": 0.1,
  "credit-growth": 0.3,
  "house-price": 0.4,
  "bond-yield-10y": 0.15,
  "govt-debt-gdp": 0.5,
  "policy-rate": 0.1,
  "gdp-growth": 0.2,
  "pmi-manufacturing": 1.0,
  "industrial-production": 0.5,
  "trade-balance": 0.2,
  "business-confidence": 1.0,
  "unemployment": 0.1,
  "consumer-confidence": 1.5,
  "retail-sales": 0.3,
  "stock-market": 2.5,
  "exchange-rate": 1.0,
  "foreign-reserves": 0.5,
  "current-account": 0.2,
};

// =============================================================================
// Narrative Arc — 4 phases of drift
// =============================================================================

// Per-indicator directional drift per month in each phase
// Positive drift = value increases (which may mean more or less risk depending on inverted flag)
// We design drifts so that risk-increasing indicators trend upward across phases.

interface NarrativeDrift {
  // Each indicator gets a drift that makes risk scores increase across phases
  // For inverted indicators (GDP, PMI, etc), negative drift = higher risk
  [indicatorId: string]: [number, number, number, number]; // [calm, building, stress, elevated]
}

const NARRATIVE_DRIFT: NarrativeDrift = {
  // Inflation: higher values = more risk → positive drift increases risk
  "cpi":                   [0.05,  0.12,  0.22,  0.22],
  "energy-price":          [0.5,   2.5,   5.0,   5.5],
  "food-price":            [0.3,   1.0,   2.0,   2.0],
  "wage-growth":           [0.02,  0.05,  0.08,  0.08],
  // Credit: symmetric — push away from safe center
  "credit-growth":         [0.05,  0.2,   0.35,  0.35],
  "house-price":           [0.05,  -0.1,  -0.35, -0.35],
  // Bond/debt/policy: higher = more stress
  "bond-yield-10y":        [0.02,  0.06,  0.10,  0.10],
  "govt-debt-gdp":         [0.3,   0.6,   1.0,   1.0],
  "policy-rate":           [0.0,   0.02,  -0.03, -0.03],
  // Macro: inverted — negative drift = higher risk
  "gdp-growth":            [-0.04, -0.10, -0.18, -0.18],
  "pmi-manufacturing":     [-0.15, -0.40, -0.70, -0.70],
  "industrial-production": [-0.08, -0.20, -0.40, -0.40],
  "trade-balance":         [-0.02, -0.05, -0.10, -0.10],
  "business-confidence":   [-0.2,  -0.5,  -0.9,  -0.9],
  // Labor: unemployment up (more risk), confidence/sales down (inverted = more risk)
  "unemployment":          [0.02,  0.06,  0.12,  0.12],
  "consumer-confidence":   [-0.2,  -0.5,  -0.9,  -0.9],
  "retail-sales":          [-0.04, -0.12, -0.22, -0.22],
  // Financial market: inverted — negative drift = higher risk
  "stock-market":          [-0.2,  -0.6,  -1.2,  -1.2],
  "exchange-rate":         [-0.05, -0.2,  -0.4,  -0.4],
  "foreign-reserves":      [-0.02, -0.10, -0.20, -0.20],
  "current-account":       [-0.02, -0.05, -0.10, -0.10],
};

function getPhase(month: number): number {
  if (month < 6) return 0;   // Calm: Apr-Sep 2024
  if (month < 12) return 1;  // Building: Oct 2024 - Mar 2025
  if (month < 18) return 2;  // Stress: Apr-Sep 2025
  return 3;                  // Elevated: Oct 2025 - Mar 2026
}

// =============================================================================
// Correlated Shocks
// =============================================================================

interface Shock {
  month: number;
  name: string;
  // Per-indicator impact (additive, applied on top of walk)
  impacts: Record<string, number>;
  // Per-region weight (0-1, how much of the shock each region absorbs)
  regionWeights: Record<string, number>;
}

const SHOCKS: Shock[] = [
  {
    month: 8, // Dec 2024
    name: "China property stress",
    impacts: {
      "house-price": -5.0,
      "stock-market": -7.0,
      "credit-growth": 3.0,
      "consumer-confidence": -5.0,
      "gdp-growth": -0.6,
      "business-confidence": -3.0,
    },
    regionWeights: { us: 0.3, europe: 0.3, china: 1.0, em: 0.6, japan: 0.4, mideast: 0.2 },
  },
  {
    month: 14, // Jun 2025
    name: "Oil supply shock",
    impacts: {
      "energy-price": 35.0,
      "cpi": 0.8,
      "gdp-growth": -0.6,
      "industrial-production": -2.0,
      "business-confidence": -4.0,
      "stock-market": -5.0,
      "food-price": 5.0,
    },
    regionWeights: { us: 0.7, europe: 1.0, china: 0.5, em: 0.8, japan: 0.9, mideast: 0.3 },
  },
  {
    month: 18, // Oct 2025
    name: "AI regulation wave",
    impacts: {
      "stock-market": -8.0,
      "unemployment": 0.5,
      "consumer-confidence": -5.0,
      "business-confidence": -3.0,
      "retail-sales": -1.0,
      "exchange-rate": -1.5,
    },
    regionWeights: { us: 1.0, europe: 0.8, china: 0.5, em: 0.4, japan: 0.6, mideast: 0.2 },
  },
  {
    month: 21, // Jan 2026
    name: "Geopolitical escalation",
    impacts: {
      "energy-price": 25.0,
      "exchange-rate": -6.0,
      "foreign-reserves": -4.0,
      "stock-market": -8.0,
      "cpi": 0.6,
      "business-confidence": -5.0,
      "consumer-confidence": -5.0,
      "bond-yield-10y": 0.4,
      "unemployment": 0.3,
      "gdp-growth": -0.4,
    },
    regionWeights: { us: 0.5, europe: 0.8, china: 0.4, em: 0.7, japan: 0.5, mideast: 1.0 },
  },
];

// Map month to event name (for snapshot event labels)
const SHOCK_EVENTS = new Map(SHOCKS.map((s) => [s.month, s.name]));

// =============================================================================
// Time-series Generator
// =============================================================================

interface GeneratedReading {
  indicatorId: string;
  regionId: string;
  date: Date;
  value: number;
  score: number;
  zScore: number;
  trend: string;
}

function generateTimeSeries(): { readings: GeneratedReading[]; snapshots: Array<Snapshot & { date: Date; event: string | null }> } {
  const regionIds = regions.map((r) => r.id);
  const indicatorIds = INDICATOR_CONFIGS.map((c) => c.id);

  // Current values tracker: values[indicatorId][regionId] = current value
  const currentValues: Record<string, Record<string, number>> = {};
  for (const indId of indicatorIds) {
    currentValues[indId] = {};
    for (const regId of regionIds) {
      currentValues[indId][regId] = BASE_VALUES[indId]?.[regId] ?? 0;
    }
  }

  const allReadings: GeneratedReading[] = [];
  const allSnapshots: Array<Snapshot & { date: Date; event: string | null }> = [];
  let previousSnapshot: Snapshot | null = null;

  for (let month = 0; month < 24; month++) {
    const date = new Date(2024, 3 + month, 1); // April 2024 = month 0
    const phase = getPhase(month);

    // Check for shocks this month
    const activeShock = SHOCKS.find((s) => s.month === month);

    const monthReadings: ScoredReading[] = [];
    const monthPreviousValues: Record<string, Record<string, number>> = {};

    for (const indId of indicatorIds) {
      const cfg = INDICATOR_CONFIGS.find((c) => c.id === indId)!;
      const volatility = VOLATILITY[indId] ?? 0.5;
      const drift = NARRATIVE_DRIFT[indId]?.[phase] ?? 0;

      for (const regId of regionIds) {
        const prevValue = currentValues[indId][regId];
        if (!monthPreviousValues[indId]) monthPreviousValues[indId] = {};
        monthPreviousValues[indId][regId] = prevValue;

        const baseValue = BASE_VALUES[indId]?.[regId] ?? cfg.historicalMean;

        // Random walk with mean reversion
        const meanReversion = 0.05 * (baseValue - prevValue);
        const noise = gaussian() * volatility;

        // Shock effect
        let shockEffect = 0;
        if (activeShock && activeShock.impacts[indId] !== undefined) {
          const regionWeight = activeShock.regionWeights[regId] ?? 0.5;
          shockEffect = activeShock.impacts[indId] * regionWeight;
        }

        let newValue = prevValue + drift + meanReversion + noise + shockEffect;

        // Clamp to indicator bounds
        newValue = Math.max(cfg.min, Math.min(cfg.max, newValue));

        // Round to reasonable precision
        newValue = parseFloat(newValue.toFixed(2));

        currentValues[indId][regId] = newValue;

        // Score using the scoring engine
        const { score, zScore } = normalizeReading(indId, regId, newValue);
        const trend = computeTrend(newValue, monthPreviousValues[indId][regId]);

        const reading: ScoredReading = {
          indicatorId: indId,
          regionId: regId,
          value: newValue,
          score,
          zScore,
          trend,
        };
        monthReadings.push(reading);

        allReadings.push({
          ...reading,
          date,
        });
      }
    }

    // Compute snapshot from this month's readings
    const snapshot = computeSnapshot(monthReadings, driverCategoryWeights, previousSnapshot);
    const event = SHOCK_EVENTS.get(month) ?? null;

    allSnapshots.push({ ...snapshot, date, event });
    previousSnapshot = snapshot;
  }

  return { readings: allReadings, snapshots: allSnapshots };
}

// =============================================================================
// Alerts — same as before, placed at the end of timeline
// =============================================================================

const alertsData = [
  {
    severity: "critical",
    title: "Risk Regime Shift Detected",
    description: "GRI has moved from 'Moderate' to 'Elevated Risk' regime. Geopolitical escalation and energy supply shock are primary contributors.",
    probability: 38,
    drivers: ["Geopolitical Conflict", "Energy Supply Shock"],
    news: [
      { title: "NATO allies increase defense spending amid Eastern Europe tensions", source: "Reuters", url: "https://reuters.com", publishedAt: new Date("2026-03-14T06:30:00Z") },
      { title: "Oil prices surge 4% as Red Sea shipping disruptions widen", source: "Bloomberg", url: "https://bloomberg.com", publishedAt: new Date("2026-03-14T05:15:00Z") },
      { title: "Global risk indicators flash highest warning since 2022", source: "Financial Times", url: "https://ft.com", publishedAt: new Date("2026-03-13T22:00:00Z") },
    ],
  },
  {
    severity: "warning",
    title: "European Macro Deterioration",
    description: "Europe PMI Manufacturing falling, deepest contraction in 14 months. Industrial production falling across major economies.",
    drivers: ["Geopolitical Conflict", "Energy Supply Shock"],
    news: [
      { title: "Eurozone factory output falls for 14th consecutive month", source: "ECB", url: "https://ecb.europa.eu", publishedAt: new Date("2026-03-13T10:00:00Z") },
      { title: "Germany's industrial orders drop 3.2% in February", source: "Destatis", url: "https://destatis.de", publishedAt: new Date("2026-03-13T08:00:00Z") },
    ],
  },
  {
    severity: "warning",
    title: "AI Concentration Risk Elevated",
    description: "Tech sector labor displacement accelerating. Consumer confidence declining in AI-exposed industries.",
    drivers: ["AI / Tech Disruption"],
    news: [
      { title: "Tech layoffs reach 28,400 in March as AI automation accelerates", source: "TechCrunch", url: "https://techcrunch.com", publishedAt: new Date("2026-03-13T09:00:00Z") },
      { title: "AI capex boom raises bubble concerns among institutional investors", source: "WSJ", url: "https://wsj.com", publishedAt: new Date("2026-03-12T18:30:00Z") },
      { title: "EU proposes sweeping AI labor displacement regulations", source: "Politico", url: "https://politico.eu", publishedAt: new Date("2026-03-12T14:00:00Z") },
    ],
  },
  {
    severity: "info",
    title: "Middle East Financial Market Stress",
    description: "Regional stock market drawdown elevated, capital outflows intensifying.",
    drivers: ["Geopolitical Conflict", "Financial Risks"],
    news: [
      { title: "Gulf state equity markets tumble as regional tensions escalate", source: "Al Jazeera", url: "https://aljazeera.com", publishedAt: new Date("2026-03-12T15:00:00Z") },
      { title: "Foreign investors pull $2.3B from Middle East funds in single week", source: "CNBC", url: "https://cnbc.com", publishedAt: new Date("2026-03-12T12:00:00Z") },
    ],
  },
];

// =============================================================================
// Main seed function
// =============================================================================

async function main() {
  console.log("Seeding GRI database with 24-month historical data...\n");

  // Generate all time-series data
  console.log("  Generating 24-month time series...");
  const { readings, snapshots } = generateTimeSeries();
  console.log(`  Generated ${readings.length} readings, ${snapshots.length} snapshots`);

  // Log GRI trajectory
  console.log("\n  GRI trajectory:");
  for (const s of snapshots) {
    const dateStr = s.date.toISOString().slice(0, 7);
    const eventStr = s.event ? ` ← ${s.event}` : "";
    console.log(`    ${dateStr}: GRI=${s.griScore} (${s.regime})${eventStr}`);
  }

  // 1. Delete existing time-series data (order matters: children → parents)
  console.log("\n  Cleaning existing time-series data...");
  await prisma.snapshotRegionScore.deleteMany();
  await prisma.snapshotCategoryScore.deleteMany();
  await prisma.snapshotDriverScore.deleteMany();
  await prisma.snapshot.deleteMany();
  await prisma.reading.deleteMany();
  await prisma.alertNews.deleteMany();
  await prisma.alert.deleteMany();

  // 2. Upsert reference data
  console.log("  Upserting reference data...");
  for (const d of drivers) {
    await prisma.driver.upsert({ where: { id: d.id }, update: d, create: d });
  }
  for (const c of riskCategories) {
    await prisma.riskCategory.upsert({ where: { id: c.id }, update: c, create: c });
  }
  for (const r of regions) {
    await prisma.region.upsert({ where: { id: r.id }, update: r, create: r });
  }
  for (const ind of indicatorDefs) {
    await prisma.indicator.upsert({ where: { id: ind.id }, update: ind, create: ind });
  }
  for (const w of driverCategoryWeights) {
    await prisma.driverCategory.upsert({
      where: { driverId_categoryId: { driverId: w.driverId, categoryId: w.categoryId } },
      update: { weight: w.weight },
      create: w,
    });
  }

  // 3. Insert readings in bulk
  console.log("  Inserting readings...");
  const readingData = readings.map((r) => ({
    indicatorId: r.indicatorId,
    regionId: r.regionId,
    date: r.date,
    value: r.value,
    score: r.score,
    zScore: r.zScore,
    trend: r.trend,
  }));

  // Batch in chunks to avoid memory issues
  const BATCH_SIZE = 500;
  for (let i = 0; i < readingData.length; i += BATCH_SIZE) {
    const batch = readingData.slice(i, i + BATCH_SIZE);
    await prisma.reading.createMany({ data: batch });
  }

  // 4. Insert snapshots sequentially (need auto-increment IDs for child records)
  console.log("  Inserting snapshots with scores...");
  for (const snap of snapshots) {
    const created = await prisma.snapshot.create({
      data: {
        date: snap.date,
        griScore: snap.griScore,
        griDelta: snap.griDelta,
        regime: snap.regime,
        event: snap.event,
      },
    });

    // Driver scores
    await prisma.snapshotDriverScore.createMany({
      data: snap.driverScores.map((d) => ({
        snapshotId: created.id,
        driverId: d.driverId,
        score: d.score,
        delta: d.delta,
      })),
    });

    // Category scores
    await prisma.snapshotCategoryScore.createMany({
      data: snap.categoryScores.map((c) => ({
        snapshotId: created.id,
        categoryId: c.categoryId,
        score: c.score,
        delta: c.delta,
      })),
    });

    // Region scores
    await prisma.snapshotRegionScore.createMany({
      data: snap.regionScores.map((r) => ({
        snapshotId: created.id,
        regionId: r.regionId,
        score: r.score,
        delta: r.delta,
        topDriverId: r.topDriverId,
      })),
    });
  }

  // 5. Insert alerts
  console.log("  Creating alerts...");
  for (const a of alertsData) {
    await prisma.alert.create({
      data: {
        severity: a.severity,
        title: a.title,
        description: a.description,
        probability: a.probability ?? null,
        drivers: a.drivers,
        news: { create: a.news },
      },
    });
  }

  // Final counts
  console.log("\nSeed complete! Row counts:");
  const counts = {
    drivers: await prisma.driver.count(),
    categories: await prisma.riskCategory.count(),
    regions: await prisma.region.count(),
    indicators: await prisma.indicator.count(),
    weights: await prisma.driverCategory.count(),
    readings: await prisma.reading.count(),
    snapshots: await prisma.snapshot.count(),
    driverScores: await prisma.snapshotDriverScore.count(),
    categoryScores: await prisma.snapshotCategoryScore.count(),
    regionScores: await prisma.snapshotRegionScore.count(),
    alerts: await prisma.alert.count(),
    news: await prisma.alertNews.count(),
  };
  console.log(counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
