"use client";

import ScoreHero from "@/components/ScoreHero";
import DriverPanel from "@/components/DriverPanel";
import RiskCategoryPanel from "@/components/RiskCategoryPanel";
import MarketOutcomesRadar from "@/components/MarketOutcomesRadar";
import TimelineChart from "@/components/TimelineChart";
import RegionalMap from "@/components/RegionalMap";
import CategoryMatrix from "@/components/CategoryMatrix";
import NetworkGraph from "@/components/NetworkGraph";
import SignalExplorer from "@/components/SignalExplorer";
import AlertSystem from "@/components/AlertSystem";
import Card from "@/components/Card";
import type {
  GlobalRiskScore,
  Driver,
  RiskCategory,
  Region,
  Indicator,
  TimelinePoint,
  CategoryMatrix as CategoryMatrixType,
  NetworkNode,
  NetworkEdge,
  Alert,
} from "@/lib/types";

interface DashboardData {
  globalRiskScore: GlobalRiskScore | null;
  drivers: Driver[];
  riskCategories: RiskCategory[];
  regions: Region[];
  indicators: Indicator[];
  timeline: TimelinePoint[];
  categoryMatrix: CategoryMatrixType;
  networkNodes: NetworkNode[];
  networkEdges: NetworkEdge[];
  alerts: Alert[];
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const score = data.globalRiskScore ?? {
    current: 0, previous: 0, delta: 0, regime: "Unknown", percentile: 0, updatedAt: "",
  };

  return (
    <div className="min-h-screen noise-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-card-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-amber-400 animate-ping opacity-30" />
              </div>
              <h1 className="text-base font-bold tracking-tight">
                <span className="text-zinc-100">GRI</span>
                <span className="text-zinc-100 font-normal ml-1.5 text-sm">
                  Global Risk Indicator
                </span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-zinc-100">
              Last updated: {score.updatedAt
                ? new Date(score.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "—"}
            </span>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-zinc-100">Regime:</span>
              <span className="text-amber-400 font-medium">{score.regime}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="mx-auto max-w-[1400px] px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Row 1: Score Hero + Timeline */}
          <Card delay={0}>
            <ScoreHero data={score} />
          </Card>

          <Card delay={0.1}>
            <TimelineChart timeline={data.timeline} />
          </Card>

          {/* Row 2: Alerts */}
          <Card colSpan={2} delay={0.15}>
            <AlertSystem alerts={data.alerts} />
          </Card>

          {/* Row 3: Drivers + Risk Categories */}
          <Card delay={0.2}>
            <DriverPanel drivers={data.drivers} />
          </Card>

          <Card delay={0.25}>
            <RiskCategoryPanel
              riskCategories={data.riskCategories}
              indicators={data.indicators}
              regions={data.regions}
            />
          </Card>

          {/* Row 4: Category Radar + Regional */}
          <Card delay={0.3}>
            <MarketOutcomesRadar riskCategories={data.riskCategories} />
          </Card>

          <Card delay={0.35}>
            <RegionalMap regions={data.regions} />
          </Card>

          {/* Row 5: Driver × Category Matrix */}
          <Card colSpan={2} delay={0.4}>
            <CategoryMatrix categoryMatrix={data.categoryMatrix} />
          </Card>

          {/* Row 6: Network Graph (Drivers → Categories) */}
          <Card colSpan={2} delay={0.45}>
            <NetworkGraph
              networkNodes={data.networkNodes}
              networkEdges={data.networkEdges}
              drivers={data.drivers}
              riskCategories={data.riskCategories}
              indicators={data.indicators}
              regions={data.regions}
            />
          </Card>

          {/* Row 7: Indicator Explorer */}
          <Card colSpan={2} delay={0.5}>
            <SignalExplorer
              indicators={data.indicators}
              riskCategories={data.riskCategories}
              regions={data.regions}
            />
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-8 pb-8 text-center">
          <p className="text-[10px] text-zinc-100 font-mono">
            GRI v0.2.0 — 5 Drivers → 5 Risk Categories → 20 Indicators × 6 Regions
          </p>
        </footer>
      </main>
    </div>
  );
}
