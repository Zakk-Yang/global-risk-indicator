import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// =============================================================================
// Reference Data — mirrors src/lib/mock-data.ts definitions
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
  { id: "us", name: "United States", code: "US" },
  { id: "europe", name: "Europe", code: "EU" },
  { id: "china", name: "China", code: "CN" },
  { id: "em", name: "Emerging Markets", code: "EM" },
  { id: "japan", name: "Japan", code: "JP" },
  { id: "mideast", name: "Middle East", code: "ME" },
];

const indicators = [
  // Inflation Pressure
  { id: "cpi", name: "CPI Inflation (YoY)", unit: "%", categoryId: "inflation" },
  { id: "energy-price", name: "Energy Price Index", unit: "idx", categoryId: "inflation" },
  { id: "food-price", name: "Food Price Index", unit: "idx", categoryId: "inflation" },
  { id: "wage-growth", name: "Wage Growth (YoY)", unit: "%", categoryId: "inflation" },
  // Credit & Liquidity Stress
  { id: "credit-growth", name: "Credit Growth (YoY)", unit: "%", categoryId: "credit-liquidity" },
  { id: "house-price", name: "House Price Index (YoY)", unit: "%", categoryId: "credit-liquidity" },
  { id: "bond-yield-10y", name: "10Y Government Bond Yield", unit: "%", categoryId: "credit-liquidity" },
  { id: "govt-debt-gdp", name: "Government Debt / GDP", unit: "%", categoryId: "credit-liquidity" },
  { id: "policy-rate", name: "Policy Interest Rate", unit: "%", categoryId: "credit-liquidity" },
  // Macro Slowdown
  { id: "gdp-growth", name: "GDP Growth (YoY)", unit: "%", categoryId: "macro-slowdown" },
  { id: "pmi-manufacturing", name: "PMI Manufacturing", unit: "idx", categoryId: "macro-slowdown" },
  { id: "industrial-production", name: "Industrial Production (YoY)", unit: "%", categoryId: "macro-slowdown" },
  { id: "trade-balance", name: "Trade Balance (% GDP)", unit: "%", categoryId: "macro-slowdown" },
  { id: "business-confidence", name: "Business Confidence Index", unit: "idx", categoryId: "macro-slowdown" },
  // Labor & Consumption Stress
  { id: "unemployment", name: "Unemployment Rate", unit: "%", categoryId: "labor-consumption" },
  { id: "consumer-confidence", name: "Consumer Confidence Index", unit: "idx", categoryId: "labor-consumption" },
  { id: "retail-sales", name: "Retail Sales (YoY)", unit: "%", categoryId: "labor-consumption" },
  // Financial Market Stress
  { id: "stock-market", name: "Stock Market Drawdown", unit: "%", categoryId: "financial-market" },
  { id: "exchange-rate", name: "Exchange Rate vs USD (YoY)", unit: "%", categoryId: "financial-market" },
  { id: "foreign-reserves", name: "Foreign Reserves (3m change)", unit: "%", categoryId: "financial-market" },
  { id: "current-account", name: "Current Account (% GDP)", unit: "%", categoryId: "financial-market" },
];

// Driver → Category contribution weights (from categoryMatrix)
const driverCategoryWeights = [
  // Geopolitical Conflict
  { driverId: "geopolitical", categoryId: "inflation", weight: 68 },
  { driverId: "geopolitical", categoryId: "credit-liquidity", weight: 32 },
  { driverId: "geopolitical", categoryId: "macro-slowdown", weight: 62 },
  { driverId: "geopolitical", categoryId: "labor-consumption", weight: 28 },
  { driverId: "geopolitical", categoryId: "financial-market", weight: 72 },
  // AI / Tech Disruption
  { driverId: "ai-disruption", categoryId: "inflation", weight: 25 },
  { driverId: "ai-disruption", categoryId: "credit-liquidity", weight: 35 },
  { driverId: "ai-disruption", categoryId: "macro-slowdown", weight: 30 },
  { driverId: "ai-disruption", categoryId: "labor-consumption", weight: 75 },
  { driverId: "ai-disruption", categoryId: "financial-market", weight: 68 },
  // Energy Supply Shock
  { driverId: "energy-shock", categoryId: "inflation", weight: 78 },
  { driverId: "energy-shock", categoryId: "credit-liquidity", weight: 28 },
  { driverId: "energy-shock", categoryId: "macro-slowdown", weight: 58 },
  { driverId: "energy-shock", categoryId: "labor-consumption", weight: 22 },
  { driverId: "energy-shock", categoryId: "financial-market", weight: 55 },
  // Monetary Tightening
  { driverId: "monetary", categoryId: "inflation", weight: 52 },
  { driverId: "monetary", categoryId: "credit-liquidity", weight: 75 },
  { driverId: "monetary", categoryId: "macro-slowdown", weight: 38 },
  { driverId: "monetary", categoryId: "labor-consumption", weight: 30 },
  { driverId: "monetary", categoryId: "financial-market", weight: 62 },
  // Financial Risks
  { driverId: "financial-risks", categoryId: "inflation", weight: 35 },
  { driverId: "financial-risks", categoryId: "credit-liquidity", weight: 72 },
  { driverId: "financial-risks", categoryId: "macro-slowdown", weight: 58 },
  { driverId: "financial-risks", categoryId: "labor-consumption", weight: 25 },
  { driverId: "financial-risks", categoryId: "financial-market", weight: 65 },
];

// Mock readings for today (from mock-data.ts indicator values)
const today = new Date("2026-03-14");

const mockReadings: { indicatorId: string; regionId: string; value: number; score: number; zScore: number; trend: string }[] = [
  // CPI
  { indicatorId: "cpi", regionId: "us", value: 3.8, score: 62, zScore: 1.5, trend: "rising" },
  { indicatorId: "cpi", regionId: "europe", value: 4.2, score: 68, zScore: 1.8, trend: "rising" },
  { indicatorId: "cpi", regionId: "china", value: 0.8, score: 25, zScore: -0.8, trend: "falling" },
  { indicatorId: "cpi", regionId: "em", value: 6.5, score: 72, zScore: 2.0, trend: "stable" },
  { indicatorId: "cpi", regionId: "japan", value: 2.8, score: 48, zScore: 0.6, trend: "rising" },
  { indicatorId: "cpi", regionId: "mideast", value: 5.1, score: 65, zScore: 1.6, trend: "rising" },
  // Energy Price
  { indicatorId: "energy-price", regionId: "us", value: 112, score: 58, zScore: 1.2, trend: "rising" },
  { indicatorId: "energy-price", regionId: "europe", value: 148, score: 78, zScore: 2.4, trend: "rising" },
  { indicatorId: "energy-price", regionId: "china", value: 105, score: 48, zScore: 0.5, trend: "stable" },
  { indicatorId: "energy-price", regionId: "em", value: 125, score: 65, zScore: 1.6, trend: "rising" },
  { indicatorId: "energy-price", regionId: "japan", value: 132, score: 68, zScore: 1.8, trend: "rising" },
  { indicatorId: "energy-price", regionId: "mideast", value: 95, score: 42, zScore: 0.2, trend: "stable" },
  // Food Price
  { indicatorId: "food-price", regionId: "us", value: 108, score: 52, zScore: 0.8, trend: "stable" },
  { indicatorId: "food-price", regionId: "europe", value: 115, score: 62, zScore: 1.4, trend: "rising" },
  { indicatorId: "food-price", regionId: "china", value: 102, score: 38, zScore: 0.1, trend: "falling" },
  { indicatorId: "food-price", regionId: "em", value: 128, score: 72, zScore: 2.1, trend: "rising" },
  { indicatorId: "food-price", regionId: "japan", value: 110, score: 55, zScore: 0.9, trend: "stable" },
  { indicatorId: "food-price", regionId: "mideast", value: 122, score: 68, zScore: 1.7, trend: "rising" },
  // Wage Growth
  { indicatorId: "wage-growth", regionId: "us", value: 4.2, score: 58, zScore: 1.2, trend: "stable" },
  { indicatorId: "wage-growth", regionId: "europe", value: 3.8, score: 52, zScore: 0.8, trend: "rising" },
  { indicatorId: "wage-growth", regionId: "china", value: 5.1, score: 45, zScore: 0.4, trend: "falling" },
  { indicatorId: "wage-growth", regionId: "em", value: 6.8, score: 55, zScore: 1.0, trend: "stable" },
  { indicatorId: "wage-growth", regionId: "japan", value: 2.5, score: 42, zScore: 0.3, trend: "rising" },
  { indicatorId: "wage-growth", regionId: "mideast", value: 3.2, score: 40, zScore: 0.1, trend: "stable" },
  // Credit Growth
  { indicatorId: "credit-growth", regionId: "us", value: 3.2, score: 55, zScore: 0.9, trend: "stable" },
  { indicatorId: "credit-growth", regionId: "europe", value: 1.8, score: 48, zScore: 0.5, trend: "falling" },
  { indicatorId: "credit-growth", regionId: "china", value: 9.5, score: 75, zScore: 2.3, trend: "rising" },
  { indicatorId: "credit-growth", regionId: "em", value: 5.8, score: 58, zScore: 1.2, trend: "stable" },
  { indicatorId: "credit-growth", regionId: "japan", value: 2.1, score: 42, zScore: 0.2, trend: "stable" },
  { indicatorId: "credit-growth", regionId: "mideast", value: 4.5, score: 52, zScore: 0.7, trend: "rising" },
  // House Price
  { indicatorId: "house-price", regionId: "us", value: 5.8, score: 62, zScore: 1.4, trend: "rising" },
  { indicatorId: "house-price", regionId: "europe", value: 2.1, score: 45, zScore: 0.3, trend: "falling" },
  { indicatorId: "house-price", regionId: "china", value: -3.2, score: 68, zScore: -1.8, trend: "falling" },
  { indicatorId: "house-price", regionId: "em", value: 4.2, score: 52, zScore: 0.7, trend: "stable" },
  { indicatorId: "house-price", regionId: "japan", value: 6.5, score: 58, zScore: 1.2, trend: "rising" },
  { indicatorId: "house-price", regionId: "mideast", value: 8.2, score: 65, zScore: 1.6, trend: "rising" },
  // Bond Yield 10Y
  { indicatorId: "bond-yield-10y", regionId: "us", value: 4.65, score: 68, zScore: 1.8, trend: "rising" },
  { indicatorId: "bond-yield-10y", regionId: "europe", value: 2.85, score: 62, zScore: 1.4, trend: "rising" },
  { indicatorId: "bond-yield-10y", regionId: "china", value: 2.35, score: 35, zScore: -0.3, trend: "falling" },
  { indicatorId: "bond-yield-10y", regionId: "em", value: 7.20, score: 65, zScore: 1.6, trend: "stable" },
  { indicatorId: "bond-yield-10y", regionId: "japan", value: 1.15, score: 55, zScore: 1.0, trend: "rising" },
  { indicatorId: "bond-yield-10y", regionId: "mideast", value: 5.10, score: 58, zScore: 1.2, trend: "stable" },
  // Govt Debt/GDP
  { indicatorId: "govt-debt-gdp", regionId: "us", value: 124, score: 72, zScore: 2.1, trend: "rising" },
  { indicatorId: "govt-debt-gdp", regionId: "europe", value: 88, score: 58, zScore: 1.1, trend: "stable" },
  { indicatorId: "govt-debt-gdp", regionId: "china", value: 82, score: 62, zScore: 1.4, trend: "rising" },
  { indicatorId: "govt-debt-gdp", regionId: "em", value: 58, score: 45, zScore: 0.3, trend: "stable" },
  { indicatorId: "govt-debt-gdp", regionId: "japan", value: 255, score: 78, zScore: 2.5, trend: "rising" },
  { indicatorId: "govt-debt-gdp", regionId: "mideast", value: 42, score: 32, zScore: -0.4, trend: "falling" },
  // Policy Rate
  { indicatorId: "policy-rate", regionId: "us", value: 5.25, score: 68, zScore: 1.8, trend: "stable" },
  { indicatorId: "policy-rate", regionId: "europe", value: 4.00, score: 65, zScore: 1.6, trend: "stable" },
  { indicatorId: "policy-rate", regionId: "china", value: 3.45, score: 38, zScore: -0.1, trend: "falling" },
  { indicatorId: "policy-rate", regionId: "em", value: 8.50, score: 62, zScore: 1.3, trend: "falling" },
  { indicatorId: "policy-rate", regionId: "japan", value: 0.25, score: 35, zScore: 0.8, trend: "rising" },
  { indicatorId: "policy-rate", regionId: "mideast", value: 5.50, score: 60, zScore: 1.3, trend: "stable" },
  // GDP Growth
  { indicatorId: "gdp-growth", regionId: "us", value: 2.1, score: 48, zScore: -0.5, trend: "falling" },
  { indicatorId: "gdp-growth", regionId: "europe", value: 0.6, score: 68, zScore: -1.8, trend: "falling" },
  { indicatorId: "gdp-growth", regionId: "china", value: 4.2, score: 62, zScore: -1.4, trend: "falling" },
  { indicatorId: "gdp-growth", regionId: "em", value: 3.5, score: 52, zScore: -0.7, trend: "stable" },
  { indicatorId: "gdp-growth", regionId: "japan", value: 0.8, score: 58, zScore: -1.2, trend: "falling" },
  { indicatorId: "gdp-growth", regionId: "mideast", value: 2.8, score: 45, zScore: -0.3, trend: "stable" },
  // PMI Manufacturing
  { indicatorId: "pmi-manufacturing", regionId: "us", value: 48.5, score: 58, zScore: -1.1, trend: "falling" },
  { indicatorId: "pmi-manufacturing", regionId: "europe", value: 45.2, score: 72, zScore: -2.0, trend: "falling" },
  { indicatorId: "pmi-manufacturing", regionId: "china", value: 49.8, score: 52, zScore: -0.5, trend: "stable" },
  { indicatorId: "pmi-manufacturing", regionId: "em", value: 50.5, score: 45, zScore: 0.1, trend: "stable" },
  { indicatorId: "pmi-manufacturing", regionId: "japan", value: 47.8, score: 62, zScore: -1.4, trend: "falling" },
  { indicatorId: "pmi-manufacturing", regionId: "mideast", value: 51.2, score: 42, zScore: 0.3, trend: "rising" },
  // Industrial Production
  { indicatorId: "industrial-production", regionId: "us", value: -0.5, score: 55, zScore: -0.9, trend: "falling" },
  { indicatorId: "industrial-production", regionId: "europe", value: -2.1, score: 68, zScore: -1.8, trend: "falling" },
  { indicatorId: "industrial-production", regionId: "china", value: 4.8, score: 42, zScore: 0.2, trend: "stable" },
  { indicatorId: "industrial-production", regionId: "em", value: 2.2, score: 48, zScore: -0.4, trend: "stable" },
  { indicatorId: "industrial-production", regionId: "japan", value: -1.2, score: 60, zScore: -1.3, trend: "falling" },
  { indicatorId: "industrial-production", regionId: "mideast", value: 3.5, score: 38, zScore: 0.1, trend: "rising" },
  // Trade Balance
  { indicatorId: "trade-balance", regionId: "us", value: -3.2, score: 62, zScore: -1.4, trend: "falling" },
  { indicatorId: "trade-balance", regionId: "europe", value: 1.8, score: 42, zScore: 0.2, trend: "stable" },
  { indicatorId: "trade-balance", regionId: "china", value: 2.5, score: 38, zScore: 0.1, trend: "falling" },
  { indicatorId: "trade-balance", regionId: "em", value: -1.5, score: 55, zScore: -0.9, trend: "falling" },
  { indicatorId: "trade-balance", regionId: "japan", value: -0.8, score: 52, zScore: -0.7, trend: "stable" },
  { indicatorId: "trade-balance", regionId: "mideast", value: 8.5, score: 35, zScore: 0.5, trend: "falling" },
  // Business Confidence
  { indicatorId: "business-confidence", regionId: "us", value: 97.5, score: 55, zScore: -0.9, trend: "falling" },
  { indicatorId: "business-confidence", regionId: "europe", value: 94.2, score: 65, zScore: -1.6, trend: "falling" },
  { indicatorId: "business-confidence", regionId: "china", value: 98.8, score: 48, zScore: -0.4, trend: "stable" },
  { indicatorId: "business-confidence", regionId: "em", value: 99.5, score: 45, zScore: -0.2, trend: "stable" },
  { indicatorId: "business-confidence", regionId: "japan", value: 96.1, score: 58, zScore: -1.1, trend: "falling" },
  { indicatorId: "business-confidence", regionId: "mideast", value: 101.2, score: 40, zScore: 0.2, trend: "rising" },
  // Unemployment
  { indicatorId: "unemployment", regionId: "us", value: 4.2, score: 52, zScore: 0.7, trend: "rising" },
  { indicatorId: "unemployment", regionId: "europe", value: 6.5, score: 58, zScore: 1.1, trend: "stable" },
  { indicatorId: "unemployment", regionId: "china", value: 5.3, score: 55, zScore: 0.9, trend: "rising" },
  { indicatorId: "unemployment", regionId: "em", value: 7.8, score: 52, zScore: 0.7, trend: "stable" },
  { indicatorId: "unemployment", regionId: "japan", value: 2.6, score: 35, zScore: -0.3, trend: "stable" },
  { indicatorId: "unemployment", regionId: "mideast", value: 9.5, score: 62, zScore: 1.4, trend: "stable" },
  // Consumer Confidence
  { indicatorId: "consumer-confidence", regionId: "us", value: 96.8, score: 55, zScore: -0.9, trend: "falling" },
  { indicatorId: "consumer-confidence", regionId: "europe", value: 92.5, score: 65, zScore: -1.6, trend: "falling" },
  { indicatorId: "consumer-confidence", regionId: "china", value: 94.2, score: 58, zScore: -1.2, trend: "falling" },
  { indicatorId: "consumer-confidence", regionId: "em", value: 98.5, score: 48, zScore: -0.4, trend: "stable" },
  { indicatorId: "consumer-confidence", regionId: "japan", value: 95.8, score: 52, zScore: -0.7, trend: "falling" },
  { indicatorId: "consumer-confidence", regionId: "mideast", value: 90.2, score: 62, zScore: -1.4, trend: "falling" },
  // Retail Sales
  { indicatorId: "retail-sales", regionId: "us", value: 2.1, score: 48, zScore: -0.5, trend: "falling" },
  { indicatorId: "retail-sales", regionId: "europe", value: 0.8, score: 58, zScore: -1.1, trend: "falling" },
  { indicatorId: "retail-sales", regionId: "china", value: 3.5, score: 55, zScore: -0.9, trend: "falling" },
  { indicatorId: "retail-sales", regionId: "em", value: 4.2, score: 42, zScore: 0.1, trend: "stable" },
  { indicatorId: "retail-sales", regionId: "japan", value: 1.2, score: 52, zScore: -0.7, trend: "falling" },
  { indicatorId: "retail-sales", regionId: "mideast", value: 2.8, score: 45, zScore: -0.3, trend: "stable" },
  // Stock Market Drawdown
  { indicatorId: "stock-market", regionId: "us", value: -8.5, score: 58, zScore: 1.2, trend: "falling" },
  { indicatorId: "stock-market", regionId: "europe", value: -12.2, score: 68, zScore: 1.8, trend: "falling" },
  { indicatorId: "stock-market", regionId: "china", value: -15.5, score: 72, zScore: 2.1, trend: "falling" },
  { indicatorId: "stock-market", regionId: "em", value: -10.8, score: 62, zScore: 1.4, trend: "falling" },
  { indicatorId: "stock-market", regionId: "japan", value: -6.2, score: 48, zScore: 0.5, trend: "stable" },
  { indicatorId: "stock-market", regionId: "mideast", value: -18.5, score: 78, zScore: 2.5, trend: "falling" },
  // Exchange Rate
  { indicatorId: "exchange-rate", regionId: "us", value: 0, score: 30, zScore: 0, trend: "stable" },
  { indicatorId: "exchange-rate", regionId: "europe", value: -5.2, score: 58, zScore: 1.2, trend: "falling" },
  { indicatorId: "exchange-rate", regionId: "china", value: -3.8, score: 55, zScore: 0.9, trend: "falling" },
  { indicatorId: "exchange-rate", regionId: "em", value: -8.5, score: 68, zScore: 1.8, trend: "falling" },
  { indicatorId: "exchange-rate", regionId: "japan", value: -7.2, score: 62, zScore: 1.5, trend: "falling" },
  { indicatorId: "exchange-rate", regionId: "mideast", value: -1.5, score: 38, zScore: 0.1, trend: "stable" },
  // Foreign Reserves
  { indicatorId: "foreign-reserves", regionId: "us", value: 0.2, score: 25, zScore: -0.2, trend: "stable" },
  { indicatorId: "foreign-reserves", regionId: "europe", value: -1.5, score: 42, zScore: 0.3, trend: "falling" },
  { indicatorId: "foreign-reserves", regionId: "china", value: -2.8, score: 58, zScore: 1.1, trend: "falling" },
  { indicatorId: "foreign-reserves", regionId: "em", value: -4.5, score: 68, zScore: 1.8, trend: "falling" },
  { indicatorId: "foreign-reserves", regionId: "japan", value: -1.2, score: 45, zScore: 0.4, trend: "falling" },
  { indicatorId: "foreign-reserves", regionId: "mideast", value: -3.2, score: 55, zScore: 0.9, trend: "falling" },
  // Current Account
  { indicatorId: "current-account", regionId: "us", value: -3.5, score: 62, zScore: 1.4, trend: "falling" },
  { indicatorId: "current-account", regionId: "europe", value: 2.1, score: 35, zScore: -0.2, trend: "stable" },
  { indicatorId: "current-account", regionId: "china", value: 1.8, score: 38, zScore: 0.0, trend: "falling" },
  { indicatorId: "current-account", regionId: "em", value: -2.2, score: 58, zScore: 1.1, trend: "falling" },
  { indicatorId: "current-account", regionId: "japan", value: 3.5, score: 32, zScore: -0.4, trend: "stable" },
  { indicatorId: "current-account", regionId: "mideast", value: 5.8, score: 28, zScore: -0.6, trend: "falling" },
];

// Timeline snapshots (12 months of history)
const timelineSnapshots = [
  { date: new Date("2025-04-01"), griScore: 42, griDelta: 0, regime: "Moderate", event: null },
  { date: new Date("2025-05-01"), griScore: 45, griDelta: 3, regime: "Moderate", event: "Fed signals pause" },
  { date: new Date("2025-06-01"), griScore: 48, griDelta: 3, regime: "Moderate", event: null },
  { date: new Date("2025-07-01"), griScore: 44, griDelta: -4, regime: "Moderate", event: null },
  { date: new Date("2025-08-01"), griScore: 51, griDelta: 7, regime: "Elevated Risk", event: "China property stress" },
  { date: new Date("2025-09-01"), griScore: 55, griDelta: 4, regime: "Elevated Risk", event: null },
  { date: new Date("2025-10-01"), griScore: 52, griDelta: -3, regime: "Elevated Risk", event: null },
  { date: new Date("2025-11-01"), griScore: 58, griDelta: 6, regime: "Elevated Risk", event: "Oil supply shock" },
  { date: new Date("2025-12-01"), griScore: 54, griDelta: -4, regime: "Elevated Risk", event: null },
  { date: new Date("2026-01-01"), griScore: 59, griDelta: 5, regime: "Elevated Risk", event: "AI regulation wave" },
  { date: new Date("2026-02-01"), griScore: 58, griDelta: -1, regime: "Elevated Risk", event: null },
  { date: new Date("2026-03-14"), griScore: 63, griDelta: 5, regime: "Elevated Risk", event: "Geopolitical escalation" },
];

// Alerts with news
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
    description: "Europe PMI Manufacturing at 45.2, deepest contraction in 14 months. Industrial production falling across major economies.",
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
    description: "Regional stock market drawdown at -18.5%, highest in 18 months. Capital outflows intensifying.",
    drivers: ["Geopolitical Conflict", "Financial Risks"],
    news: [
      { title: "Gulf state equity markets tumble as regional tensions escalate", source: "Al Jazeera", url: "https://aljazeera.com", publishedAt: new Date("2026-03-12T15:00:00Z") },
      { title: "Foreign investors pull $2.3B from Middle East funds in single week", source: "CNBC", url: "https://cnbc.com", publishedAt: new Date("2026-03-12T12:00:00Z") },
    ],
  },
];

async function main() {
  console.log("Seeding GRI database...\n");

  // 1. Reference data
  console.log("  Creating drivers...");
  for (const d of drivers) {
    await prisma.driver.upsert({ where: { id: d.id }, update: d, create: d });
  }

  console.log("  Creating risk categories...");
  for (const c of riskCategories) {
    await prisma.riskCategory.upsert({ where: { id: c.id }, update: c, create: c });
  }

  console.log("  Creating regions...");
  for (const r of regions) {
    await prisma.region.upsert({ where: { id: r.id }, update: r, create: r });
  }

  console.log("  Creating indicators...");
  for (const ind of indicators) {
    await prisma.indicator.upsert({ where: { id: ind.id }, update: ind, create: ind });
  }

  console.log("  Creating driver-category weights...");
  for (const w of driverCategoryWeights) {
    await prisma.driverCategory.upsert({
      where: { driverId_categoryId: { driverId: w.driverId, categoryId: w.categoryId } },
      update: { weight: w.weight },
      create: w,
    });
  }

  // 2. Readings (mock data for today)
  console.log("  Creating indicator readings...");
  for (const r of mockReadings) {
    await prisma.reading.upsert({
      where: {
        indicatorId_regionId_date: {
          indicatorId: r.indicatorId,
          regionId: r.regionId,
          date: today,
        },
      },
      update: { value: r.value, score: r.score, zScore: r.zScore, trend: r.trend },
      create: { ...r, date: today },
    });
  }

  // 3. Timeline snapshots
  console.log("  Creating timeline snapshots...");
  for (const s of timelineSnapshots) {
    await prisma.snapshot.upsert({
      where: { date: s.date },
      update: { griScore: s.griScore, griDelta: s.griDelta, regime: s.regime, event: s.event },
      create: { date: s.date, griScore: s.griScore, griDelta: s.griDelta, regime: s.regime, event: s.event },
    });
  }

  // 4. Snapshot scores for the latest snapshot (Mar 14)
  console.log("  Creating snapshot scores...");
  const latestSnap = await prisma.snapshot.findUnique({ where: { date: new Date("2026-03-14") } });
  if (latestSnap) {
    // Driver scores
    const driverScores = [
      { driverId: "geopolitical", score: 72, delta: 8 },
      { driverId: "ai-disruption", score: 65, delta: 5 },
      { driverId: "energy-shock", score: 58, delta: 4 },
      { driverId: "monetary", score: 55, delta: 3 },
      { driverId: "financial-risks", score: 52, delta: 2 },
    ];
    for (const ds of driverScores) {
      await prisma.snapshotDriverScore.upsert({
        where: { snapshotId_driverId: { snapshotId: latestSnap.id, driverId: ds.driverId } },
        update: { score: ds.score, delta: ds.delta },
        create: { snapshotId: latestSnap.id, ...ds },
      });
    }

    // Category scores
    const categoryScores = [
      { categoryId: "inflation", score: 66, delta: 6 },
      { categoryId: "credit-liquidity", score: 61, delta: 5 },
      { categoryId: "macro-slowdown", score: 58, delta: 4 },
      { categoryId: "labor-consumption", score: 54, delta: 3 },
      { categoryId: "financial-market", score: 62, delta: 5 },
    ];
    for (const cs of categoryScores) {
      await prisma.snapshotCategoryScore.upsert({
        where: { snapshotId_categoryId: { snapshotId: latestSnap.id, categoryId: cs.categoryId } },
        update: { score: cs.score, delta: cs.delta },
        create: { snapshotId: latestSnap.id, ...cs },
      });
    }

    // Region scores
    const regionScores = [
      { regionId: "us", score: 58, delta: 3, topDriverId: "monetary" },
      { regionId: "europe", score: 71, delta: 7, topDriverId: "geopolitical" },
      { regionId: "china", score: 61, delta: 4, topDriverId: "financial-risks" },
      { regionId: "em", score: 55, delta: 2, topDriverId: "geopolitical" },
      { regionId: "japan", score: 45, delta: -1, topDriverId: "monetary" },
      { regionId: "mideast", score: 76, delta: 9, topDriverId: "geopolitical" },
    ];
    for (const rs of regionScores) {
      await prisma.snapshotRegionScore.upsert({
        where: { snapshotId_regionId: { snapshotId: latestSnap.id, regionId: rs.regionId } },
        update: { score: rs.score, delta: rs.delta, topDriverId: rs.topDriverId },
        create: { snapshotId: latestSnap.id, ...rs },
      });
    }
  }

  // 5. Alerts with news
  console.log("  Creating alerts...");
  // Clear existing alerts first
  await prisma.alertNews.deleteMany();
  await prisma.alert.deleteMany();
  for (const a of alertsData) {
    await prisma.alert.create({
      data: {
        severity: a.severity,
        title: a.title,
        description: a.description,
        probability: a.probability ?? null,
        drivers: a.drivers,
        news: {
          create: a.news,
        },
      },
    });
  }

  console.log("\nSeed complete!");
  const counts = {
    drivers: await prisma.driver.count(),
    categories: await prisma.riskCategory.count(),
    regions: await prisma.region.count(),
    indicators: await prisma.indicator.count(),
    weights: await prisma.driverCategory.count(),
    readings: await prisma.reading.count(),
    snapshots: await prisma.snapshot.count(),
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
