// Shared types for the GRI dashboard — used by mock-data, queries, and components

export interface IndicatorRegionValue {
  value: number;
  score: number;
  zScore: number;
  trend: "rising" | "falling" | "stable";
}

export interface Indicator {
  id: string;
  name: string;
  unit: string;
  category: string;
  regions: Record<string, IndicatorRegionValue>;
}

export interface Driver {
  id: string;
  name: string;
  score: number;
  delta: number;
  color: string;
  categories: string[];
  description: string;
}

export interface RiskCategory {
  id: string;
  name: string;
  score: number;
  delta: number;
  indicators: string[];
  drivers: string[];
}

export interface Region {
  id: string;
  name: string;
  code: string;
  score: number;
  delta: number;
  topDriver: string;
  categoryScores: Record<string, number>;
}

export interface TimelinePoint {
  date: string;
  score: number;
  event?: string;
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  timestamp: string;
  drivers: string[];
  probability?: number;
  news: NewsItem[];
}

export interface NetworkNode {
  id: string;
  label: string;
  type: "driver" | "category";
  score: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
}

export interface GlobalRiskScore {
  current: number;
  previous: number;
  delta: number;
  regime: string;
  percentile: number;
  updatedAt: string;
}

export interface CategoryMatrix {
  drivers: string[];
  categories: string[];
  values: number[][];
}
