// =============================================================================
// GRI Mock Data Layer
// Architecture: 5 Drivers → 5 Risk Categories ← ~20 Indicators × 6 Regions
// =============================================================================

// Re-export types from shared types file
export type {
  Indicator,
  IndicatorRegionValue,
  Driver,
  RiskCategory,
  Region,
  TimelinePoint,
  NewsItem,
  Alert,
  NetworkNode,
  NetworkEdge,
  GlobalRiskScore,
  CategoryMatrix,
} from "./types";

import type {
  Indicator,
  Driver,
  RiskCategory,
  Region,
  TimelinePoint,
  Alert,
  NetworkNode,
  NetworkEdge,
} from "./types";

// --- Global Risk Score ---
export const globalRiskScore = {
  current: 63,
  previous: 58,
  delta: +5,
  regime: "Elevated Risk" as const,
  percentile: 78,
  updatedAt: "2026-03-14T09:30:00Z",
};

// --- 5 Drivers ---
export const drivers: Driver[] = [
  {
    id: "geopolitical",
    name: "Geopolitical Conflict",
    score: 72,
    delta: +8,
    color: "#ef4444",
    categories: ["financial-market", "inflation", "macro-slowdown"],
    description: "Wars, sanctions, territorial disputes, and political instability",
  },
  {
    id: "ai-disruption",
    name: "AI / Tech Disruption",
    score: 65,
    delta: +5,
    color: "#8b5cf6",
    categories: ["labor-consumption", "financial-market"],
    description: "Automation displacement, AI capex cycles, tech concentration",
  },
  {
    id: "energy-shock",
    name: "Energy Supply Shock",
    score: 58,
    delta: +4,
    color: "#f59e0b",
    categories: ["inflation", "macro-slowdown", "financial-market"],
    description: "Oil/gas supply disruptions, energy transition shocks",
  },
  {
    id: "monetary",
    name: "Monetary Tightening",
    score: 55,
    delta: +3,
    color: "#3b82f6",
    categories: ["credit-liquidity", "financial-market", "inflation"],
    description: "Central bank rate hikes, quantitative tightening, policy divergence",
  },
  {
    id: "financial-risks",
    name: "Financial Risks",
    score: 52,
    delta: +2,
    color: "#ec4899",
    categories: ["credit-liquidity", "financial-market", "macro-slowdown"],
    description: "Asset bubbles, fiscal deficits, sovereign debt, systemic leverage",
  },
];

// --- 5 Risk Categories ---
export const riskCategories: RiskCategory[] = [
  {
    id: "inflation",
    name: "Inflation Pressure",
    score: 66,
    delta: +6,
    indicators: ["cpi", "energy-price", "food-price", "wage-growth"],
    drivers: ["geopolitical", "energy-shock", "monetary"],
  },
  {
    id: "credit-liquidity",
    name: "Credit & Liquidity Stress",
    score: 61,
    delta: +5,
    indicators: ["credit-growth", "house-price", "bond-yield-10y", "govt-debt-gdp", "policy-rate"],
    drivers: ["monetary", "financial-risks"],
  },
  {
    id: "macro-slowdown",
    name: "Macro Slowdown",
    score: 58,
    delta: +4,
    indicators: ["gdp-growth", "pmi-manufacturing", "industrial-production", "trade-balance", "business-confidence"],
    drivers: ["geopolitical", "energy-shock", "financial-risks"],
  },
  {
    id: "labor-consumption",
    name: "Labor & Consumption Stress",
    score: 54,
    delta: +3,
    indicators: ["unemployment", "consumer-confidence", "retail-sales", "wage-growth"],
    drivers: ["ai-disruption"],
  },
  {
    id: "financial-market",
    name: "Financial Market Stress",
    score: 62,
    delta: +5,
    indicators: ["stock-market", "exchange-rate", "foreign-reserves", "current-account"],
    drivers: ["geopolitical", "ai-disruption", "energy-shock", "monetary", "financial-risks"],
  },
];

// --- 6 Regions ---
export const regions: Region[] = [
  {
    id: "us", name: "United States", code: "US", score: 58, delta: +3, topDriver: "Monetary Tightening",
    categoryScores: { "inflation": 62, "credit-liquidity": 65, "macro-slowdown": 52, "labor-consumption": 55, "financial-market": 58 },
  },
  {
    id: "europe", name: "Europe", code: "EU", score: 71, delta: +7, topDriver: "Geopolitical Conflict",
    categoryScores: { "inflation": 74, "credit-liquidity": 68, "macro-slowdown": 72, "labor-consumption": 62, "financial-market": 70 },
  },
  {
    id: "china", name: "China", code: "CN", score: 61, delta: +4, topDriver: "Financial Risks",
    categoryScores: { "inflation": 45, "credit-liquidity": 72, "macro-slowdown": 65, "labor-consumption": 58, "financial-market": 64 },
  },
  {
    id: "em", name: "Emerging Markets", code: "EM", score: 55, delta: +2, topDriver: "Geopolitical Conflict",
    categoryScores: { "inflation": 68, "credit-liquidity": 52, "macro-slowdown": 48, "labor-consumption": 50, "financial-market": 58 },
  },
  {
    id: "japan", name: "Japan", code: "JP", score: 45, delta: -1, topDriver: "Monetary Tightening",
    categoryScores: { "inflation": 42, "credit-liquidity": 48, "macro-slowdown": 45, "labor-consumption": 38, "financial-market": 50 },
  },
  {
    id: "mideast", name: "Middle East", code: "ME", score: 76, delta: +9, topDriver: "Geopolitical Conflict",
    categoryScores: { "inflation": 70, "credit-liquidity": 55, "macro-slowdown": 65, "labor-consumption": 48, "financial-market": 82 },
  },
];

// --- ~20 Indicators × 6 Regions ---
export const indicators: Indicator[] = [
  // === Inflation Pressure ===
  {
    id: "cpi", name: "CPI Inflation (YoY)", unit: "%", category: "inflation",
    regions: {
      us: { value: 3.8, score: 62, zScore: 1.5, trend: "rising" },
      europe: { value: 4.2, score: 68, zScore: 1.8, trend: "rising" },
      china: { value: 0.8, score: 25, zScore: -0.8, trend: "falling" },
      em: { value: 6.5, score: 72, zScore: 2.0, trend: "stable" },
      japan: { value: 2.8, score: 48, zScore: 0.6, trend: "rising" },
      mideast: { value: 5.1, score: 65, zScore: 1.6, trend: "rising" },
    },
  },
  {
    id: "energy-price", name: "Energy Price Index", unit: "idx", category: "inflation",
    regions: {
      us: { value: 112, score: 58, zScore: 1.2, trend: "rising" },
      europe: { value: 148, score: 78, zScore: 2.4, trend: "rising" },
      china: { value: 105, score: 48, zScore: 0.5, trend: "stable" },
      em: { value: 125, score: 65, zScore: 1.6, trend: "rising" },
      japan: { value: 132, score: 68, zScore: 1.8, trend: "rising" },
      mideast: { value: 95, score: 42, zScore: 0.2, trend: "stable" },
    },
  },
  {
    id: "food-price", name: "Food Price Index", unit: "idx", category: "inflation",
    regions: {
      us: { value: 108, score: 52, zScore: 0.8, trend: "stable" },
      europe: { value: 115, score: 62, zScore: 1.4, trend: "rising" },
      china: { value: 102, score: 38, zScore: 0.1, trend: "falling" },
      em: { value: 128, score: 72, zScore: 2.1, trend: "rising" },
      japan: { value: 110, score: 55, zScore: 0.9, trend: "stable" },
      mideast: { value: 122, score: 68, zScore: 1.7, trend: "rising" },
    },
  },
  {
    id: "wage-growth", name: "Wage Growth (YoY)", unit: "%", category: "inflation",
    regions: {
      us: { value: 4.2, score: 58, zScore: 1.2, trend: "stable" },
      europe: { value: 3.8, score: 52, zScore: 0.8, trend: "rising" },
      china: { value: 5.1, score: 45, zScore: 0.4, trend: "falling" },
      em: { value: 6.8, score: 55, zScore: 1.0, trend: "stable" },
      japan: { value: 2.5, score: 42, zScore: 0.3, trend: "rising" },
      mideast: { value: 3.2, score: 40, zScore: 0.1, trend: "stable" },
    },
  },

  // === Credit & Liquidity Stress ===
  {
    id: "credit-growth", name: "Credit Growth (YoY)", unit: "%", category: "credit-liquidity",
    regions: {
      us: { value: 3.2, score: 55, zScore: 0.9, trend: "stable" },
      europe: { value: 1.8, score: 48, zScore: 0.5, trend: "falling" },
      china: { value: 9.5, score: 75, zScore: 2.3, trend: "rising" },
      em: { value: 5.8, score: 58, zScore: 1.2, trend: "stable" },
      japan: { value: 2.1, score: 42, zScore: 0.2, trend: "stable" },
      mideast: { value: 4.5, score: 52, zScore: 0.7, trend: "rising" },
    },
  },
  {
    id: "house-price", name: "House Price Index (YoY)", unit: "%", category: "credit-liquidity",
    regions: {
      us: { value: 5.8, score: 62, zScore: 1.4, trend: "rising" },
      europe: { value: 2.1, score: 45, zScore: 0.3, trend: "falling" },
      china: { value: -3.2, score: 68, zScore: -1.8, trend: "falling" },
      em: { value: 4.2, score: 52, zScore: 0.7, trend: "stable" },
      japan: { value: 6.5, score: 58, zScore: 1.2, trend: "rising" },
      mideast: { value: 8.2, score: 65, zScore: 1.6, trend: "rising" },
    },
  },
  {
    id: "bond-yield-10y", name: "10Y Government Bond Yield", unit: "%", category: "credit-liquidity",
    regions: {
      us: { value: 4.65, score: 68, zScore: 1.8, trend: "rising" },
      europe: { value: 2.85, score: 62, zScore: 1.4, trend: "rising" },
      china: { value: 2.35, score: 35, zScore: -0.3, trend: "falling" },
      em: { value: 7.20, score: 65, zScore: 1.6, trend: "stable" },
      japan: { value: 1.15, score: 55, zScore: 1.0, trend: "rising" },
      mideast: { value: 5.10, score: 58, zScore: 1.2, trend: "stable" },
    },
  },
  {
    id: "govt-debt-gdp", name: "Government Debt / GDP", unit: "%", category: "credit-liquidity",
    regions: {
      us: { value: 124, score: 72, zScore: 2.1, trend: "rising" },
      europe: { value: 88, score: 58, zScore: 1.1, trend: "stable" },
      china: { value: 82, score: 62, zScore: 1.4, trend: "rising" },
      em: { value: 58, score: 45, zScore: 0.3, trend: "stable" },
      japan: { value: 255, score: 78, zScore: 2.5, trend: "rising" },
      mideast: { value: 42, score: 32, zScore: -0.4, trend: "falling" },
    },
  },
  {
    id: "policy-rate", name: "Policy Interest Rate", unit: "%", category: "credit-liquidity",
    regions: {
      us: { value: 5.25, score: 68, zScore: 1.8, trend: "stable" },
      europe: { value: 4.00, score: 65, zScore: 1.6, trend: "stable" },
      china: { value: 3.45, score: 38, zScore: -0.1, trend: "falling" },
      em: { value: 8.50, score: 62, zScore: 1.3, trend: "falling" },
      japan: { value: 0.25, score: 35, zScore: 0.8, trend: "rising" },
      mideast: { value: 5.50, score: 60, zScore: 1.3, trend: "stable" },
    },
  },

  // === Macro Slowdown ===
  {
    id: "gdp-growth", name: "GDP Growth (YoY)", unit: "%", category: "macro-slowdown",
    regions: {
      us: { value: 2.1, score: 48, zScore: -0.5, trend: "falling" },
      europe: { value: 0.6, score: 68, zScore: -1.8, trend: "falling" },
      china: { value: 4.2, score: 62, zScore: -1.4, trend: "falling" },
      em: { value: 3.5, score: 52, zScore: -0.7, trend: "stable" },
      japan: { value: 0.8, score: 58, zScore: -1.2, trend: "falling" },
      mideast: { value: 2.8, score: 45, zScore: -0.3, trend: "stable" },
    },
  },
  {
    id: "pmi-manufacturing", name: "PMI Manufacturing", unit: "idx", category: "macro-slowdown",
    regions: {
      us: { value: 48.5, score: 58, zScore: -1.1, trend: "falling" },
      europe: { value: 45.2, score: 72, zScore: -2.0, trend: "falling" },
      china: { value: 49.8, score: 52, zScore: -0.5, trend: "stable" },
      em: { value: 50.5, score: 45, zScore: 0.1, trend: "stable" },
      japan: { value: 47.8, score: 62, zScore: -1.4, trend: "falling" },
      mideast: { value: 51.2, score: 42, zScore: 0.3, trend: "rising" },
    },
  },
  {
    id: "industrial-production", name: "Industrial Production (YoY)", unit: "%", category: "macro-slowdown",
    regions: {
      us: { value: -0.5, score: 55, zScore: -0.9, trend: "falling" },
      europe: { value: -2.1, score: 68, zScore: -1.8, trend: "falling" },
      china: { value: 4.8, score: 42, zScore: 0.2, trend: "stable" },
      em: { value: 2.2, score: 48, zScore: -0.4, trend: "stable" },
      japan: { value: -1.2, score: 60, zScore: -1.3, trend: "falling" },
      mideast: { value: 3.5, score: 38, zScore: 0.1, trend: "rising" },
    },
  },
  {
    id: "trade-balance", name: "Trade Balance (% GDP)", unit: "%", category: "macro-slowdown",
    regions: {
      us: { value: -3.2, score: 62, zScore: -1.4, trend: "falling" },
      europe: { value: 1.8, score: 42, zScore: 0.2, trend: "stable" },
      china: { value: 2.5, score: 38, zScore: 0.1, trend: "falling" },
      em: { value: -1.5, score: 55, zScore: -0.9, trend: "falling" },
      japan: { value: -0.8, score: 52, zScore: -0.7, trend: "stable" },
      mideast: { value: 8.5, score: 35, zScore: 0.5, trend: "falling" },
    },
  },
  {
    id: "business-confidence", name: "Business Confidence Index", unit: "idx", category: "macro-slowdown",
    regions: {
      us: { value: 97.5, score: 55, zScore: -0.9, trend: "falling" },
      europe: { value: 94.2, score: 65, zScore: -1.6, trend: "falling" },
      china: { value: 98.8, score: 48, zScore: -0.4, trend: "stable" },
      em: { value: 99.5, score: 45, zScore: -0.2, trend: "stable" },
      japan: { value: 96.1, score: 58, zScore: -1.1, trend: "falling" },
      mideast: { value: 101.2, score: 40, zScore: 0.2, trend: "rising" },
    },
  },

  // === Labor & Consumption Stress ===
  {
    id: "unemployment", name: "Unemployment Rate", unit: "%", category: "labor-consumption",
    regions: {
      us: { value: 4.2, score: 52, zScore: 0.7, trend: "rising" },
      europe: { value: 6.5, score: 58, zScore: 1.1, trend: "stable" },
      china: { value: 5.3, score: 55, zScore: 0.9, trend: "rising" },
      em: { value: 7.8, score: 52, zScore: 0.7, trend: "stable" },
      japan: { value: 2.6, score: 35, zScore: -0.3, trend: "stable" },
      mideast: { value: 9.5, score: 62, zScore: 1.4, trend: "stable" },
    },
  },
  {
    id: "consumer-confidence", name: "Consumer Confidence Index", unit: "idx", category: "labor-consumption",
    regions: {
      us: { value: 96.8, score: 55, zScore: -0.9, trend: "falling" },
      europe: { value: 92.5, score: 65, zScore: -1.6, trend: "falling" },
      china: { value: 94.2, score: 58, zScore: -1.2, trend: "falling" },
      em: { value: 98.5, score: 48, zScore: -0.4, trend: "stable" },
      japan: { value: 95.8, score: 52, zScore: -0.7, trend: "falling" },
      mideast: { value: 90.2, score: 62, zScore: -1.4, trend: "falling" },
    },
  },
  {
    id: "retail-sales", name: "Retail Sales (YoY)", unit: "%", category: "labor-consumption",
    regions: {
      us: { value: 2.1, score: 48, zScore: -0.5, trend: "falling" },
      europe: { value: 0.8, score: 58, zScore: -1.1, trend: "falling" },
      china: { value: 3.5, score: 55, zScore: -0.9, trend: "falling" },
      em: { value: 4.2, score: 42, zScore: 0.1, trend: "stable" },
      japan: { value: 1.2, score: 52, zScore: -0.7, trend: "falling" },
      mideast: { value: 2.8, score: 45, zScore: -0.3, trend: "stable" },
    },
  },

  // === Financial Market Stress ===
  {
    id: "stock-market", name: "Stock Market Drawdown", unit: "%", category: "financial-market",
    regions: {
      us: { value: -8.5, score: 58, zScore: 1.2, trend: "falling" },
      europe: { value: -12.2, score: 68, zScore: 1.8, trend: "falling" },
      china: { value: -15.5, score: 72, zScore: 2.1, trend: "falling" },
      em: { value: -10.8, score: 62, zScore: 1.4, trend: "falling" },
      japan: { value: -6.2, score: 48, zScore: 0.5, trend: "stable" },
      mideast: { value: -18.5, score: 78, zScore: 2.5, trend: "falling" },
    },
  },
  {
    id: "exchange-rate", name: "Exchange Rate vs USD (YoY)", unit: "%", category: "financial-market",
    regions: {
      us: { value: 0, score: 30, zScore: 0, trend: "stable" },
      europe: { value: -5.2, score: 58, zScore: 1.2, trend: "falling" },
      china: { value: -3.8, score: 55, zScore: 0.9, trend: "falling" },
      em: { value: -8.5, score: 68, zScore: 1.8, trend: "falling" },
      japan: { value: -7.2, score: 62, zScore: 1.5, trend: "falling" },
      mideast: { value: -1.5, score: 38, zScore: 0.1, trend: "stable" },
    },
  },
  {
    id: "foreign-reserves", name: "Foreign Reserves (3m change)", unit: "%", category: "financial-market",
    regions: {
      us: { value: 0.2, score: 25, zScore: -0.2, trend: "stable" },
      europe: { value: -1.5, score: 42, zScore: 0.3, trend: "falling" },
      china: { value: -2.8, score: 58, zScore: 1.1, trend: "falling" },
      em: { value: -4.5, score: 68, zScore: 1.8, trend: "falling" },
      japan: { value: -1.2, score: 45, zScore: 0.4, trend: "falling" },
      mideast: { value: -3.2, score: 55, zScore: 0.9, trend: "falling" },
    },
  },
  {
    id: "current-account", name: "Current Account (% GDP)", unit: "%", category: "financial-market",
    regions: {
      us: { value: -3.5, score: 62, zScore: 1.4, trend: "falling" },
      europe: { value: 2.1, score: 35, zScore: -0.2, trend: "stable" },
      china: { value: 1.8, score: 38, zScore: 0.0, trend: "falling" },
      em: { value: -2.2, score: 58, zScore: 1.1, trend: "falling" },
      japan: { value: 3.5, score: 32, zScore: -0.4, trend: "stable" },
      mideast: { value: 5.8, score: 28, zScore: -0.6, trend: "falling" },
    },
  },
];

// --- Category Breakdown Matrix (drivers × categories) ---
export const categoryMatrix = {
  drivers: drivers.map((d) => d.name),
  categories: riskCategories.map((c) => c.name),
  // How much each driver contributes to each category (0-100)
  values: [
    // Inflation, Credit&Liq, Macro, Labor, FinMarket
    [68, 32, 62, 28, 72],  // Geopolitical Conflict
    [25, 35, 30, 75, 68],  // AI / Tech Disruption
    [78, 28, 58, 22, 55],  // Energy Supply Shock
    [52, 75, 38, 30, 62],  // Monetary Tightening
    [35, 72, 58, 25, 65],  // Financial Risks
  ],
};

// --- Network Graph (Drivers → Risk Categories) ---
export const networkNodes: NetworkNode[] = [
  // Drivers
  ...drivers.map((d) => ({
    id: `n-${d.id}`,
    label: d.name,
    type: "driver" as const,
    score: d.score,
  })),
  // Categories
  ...riskCategories.map((c) => ({
    id: `n-${c.id}`,
    label: c.name,
    type: "category" as const,
    score: c.score,
  })),
];

export const networkEdges: NetworkEdge[] = [
  // Geopolitical → Financial Market, Inflation, Macro
  { source: "n-geopolitical", target: "n-financial-market", weight: 0.9 },
  { source: "n-geopolitical", target: "n-inflation", weight: 0.7 },
  { source: "n-geopolitical", target: "n-macro-slowdown", weight: 0.6 },
  // AI → Labor, Financial Market
  { source: "n-ai-disruption", target: "n-labor-consumption", weight: 0.9 },
  { source: "n-ai-disruption", target: "n-financial-market", weight: 0.7 },
  // Energy → Inflation, Macro, Financial Market
  { source: "n-energy-shock", target: "n-inflation", weight: 0.9 },
  { source: "n-energy-shock", target: "n-macro-slowdown", weight: 0.6 },
  { source: "n-energy-shock", target: "n-financial-market", weight: 0.5 },
  // Monetary → Credit, Financial Market, Inflation
  { source: "n-monetary", target: "n-credit-liquidity", weight: 0.9 },
  { source: "n-monetary", target: "n-financial-market", weight: 0.6 },
  { source: "n-monetary", target: "n-inflation", weight: 0.5 },
  // Financial Risks → Credit, Financial Market, Macro
  { source: "n-financial-risks", target: "n-credit-liquidity", weight: 0.8 },
  { source: "n-financial-risks", target: "n-financial-market", weight: 0.7 },
  { source: "n-financial-risks", target: "n-macro-slowdown", weight: 0.6 },
];

// --- Timeline (12 months) ---
export const timeline: TimelinePoint[] = [
  { date: "2025-04", score: 42 },
  { date: "2025-05", score: 45, event: "Fed signals pause" },
  { date: "2025-06", score: 48 },
  { date: "2025-07", score: 44 },
  { date: "2025-08", score: 51, event: "China property stress" },
  { date: "2025-09", score: 55 },
  { date: "2025-10", score: 52 },
  { date: "2025-11", score: 58, event: "Oil supply shock" },
  { date: "2025-12", score: 54 },
  { date: "2026-01", score: 59, event: "AI regulation wave" },
  { date: "2026-02", score: 58 },
  { date: "2026-03", score: 63, event: "Geopolitical escalation" },
];

// --- Alerts ---
export const alerts: Alert[] = [
  {
    id: "alert-1",
    severity: "critical",
    title: "Risk Regime Shift Detected",
    description: "GRI has moved from 'Moderate' to 'Elevated Risk' regime. Geopolitical escalation and energy supply shock are primary contributors.",
    timestamp: "2026-03-14T08:15:00Z",
    drivers: ["Geopolitical Conflict", "Energy Supply Shock"],
    probability: 38,
    news: [
      { title: "NATO allies increase defense spending amid Eastern Europe tensions", source: "Reuters", url: "https://reuters.com", timestamp: "2026-03-14T06:30:00Z" },
      { title: "Oil prices surge 4% as Red Sea shipping disruptions widen", source: "Bloomberg", url: "https://bloomberg.com", timestamp: "2026-03-14T05:15:00Z" },
      { title: "Global risk indicators flash highest warning since 2022", source: "Financial Times", url: "https://ft.com", timestamp: "2026-03-13T22:00:00Z" },
    ],
  },
  {
    id: "alert-2",
    severity: "warning",
    title: "European Macro Deterioration",
    description: "Europe PMI Manufacturing at 45.2, deepest contraction in 14 months. Industrial production falling across major economies.",
    timestamp: "2026-03-13T14:30:00Z",
    drivers: ["Geopolitical Conflict", "Energy Supply Shock"],
    news: [
      { title: "Eurozone factory output falls for 14th consecutive month", source: "ECB", url: "https://ecb.europa.eu", timestamp: "2026-03-13T10:00:00Z" },
      { title: "Germany's industrial orders drop 3.2% in February", source: "Destatis", url: "https://destatis.de", timestamp: "2026-03-13T08:00:00Z" },
    ],
  },
  {
    id: "alert-3",
    severity: "warning",
    title: "AI Concentration Risk Elevated",
    description: "Tech sector labor displacement accelerating. Consumer confidence declining in AI-exposed industries.",
    timestamp: "2026-03-13T10:00:00Z",
    drivers: ["AI / Tech Disruption"],
    news: [
      { title: "Tech layoffs reach 28,400 in March as AI automation accelerates", source: "TechCrunch", url: "https://techcrunch.com", timestamp: "2026-03-13T09:00:00Z" },
      { title: "AI capex boom raises bubble concerns among institutional investors", source: "WSJ", url: "https://wsj.com", timestamp: "2026-03-12T18:30:00Z" },
      { title: "EU proposes sweeping AI labor displacement regulations", source: "Politico", url: "https://politico.eu", timestamp: "2026-03-12T14:00:00Z" },
    ],
  },
  {
    id: "alert-4",
    severity: "info",
    title: "Middle East Financial Market Stress",
    description: "Regional stock market drawdown at -18.5%, highest in 18 months. Capital outflows intensifying.",
    timestamp: "2026-03-12T16:45:00Z",
    drivers: ["Geopolitical Conflict", "Financial Risks"],
    news: [
      { title: "Gulf state equity markets tumble as regional tensions escalate", source: "Al Jazeera", url: "https://aljazeera.com", timestamp: "2026-03-12T15:00:00Z" },
      { title: "Foreign investors pull $2.3B from Middle East funds in single week", source: "CNBC", url: "https://cnbc.com", timestamp: "2026-03-12T12:00:00Z" },
    ],
  },
];

// --- Helper functions ---
export function getRiskColor(score: number): string {
  if (score >= 70) return "#ef4444";
  if (score >= 50) return "#f59e0b";
  return "#22c55e";
}

export function getRiskLabel(score: number): string {
  if (score >= 80) return "Critical";
  if (score >= 70) return "High Risk";
  if (score >= 60) return "Elevated";
  if (score >= 50) return "Moderate";
  if (score >= 35) return "Low";
  return "Minimal";
}
