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
  const sortedDrivers = [...data.drivers].sort((a, b) => b.score - a.score);
  const sortedCategories = [...data.riskCategories].sort((a, b) => b.score - a.score);
  const sortedRegions = [...data.regions].sort((a, b) => b.score - a.score);
  const leadDriver = sortedDrivers[0];
  const hottestCategory = sortedCategories[0];
  const hottestRegion = sortedRegions[0];
  const populatedSignals = data.indicators.reduce(
    (total, indicator) => total + Object.keys(indicator.regions).length,
    0
  );
  const totalSignalSlots = data.indicators.length * data.regions.length;
  const coverage = totalSignalSlots > 0
    ? Math.round((populatedSignals / totalSignalSlots) * 100)
    : 0;
  const elevatedCategories = data.riskCategories.filter((category) => category.score >= 65).length;
  const averageRegionScore = data.regions.length > 0
    ? Math.round(data.regions.reduce((sum, region) => sum + region.score, 0) / data.regions.length)
    : 0;
  const latestCatalyst = [...data.timeline].reverse().find((point) => point.event)?.event ?? "No tagged catalyst";
  const lastUpdated = score.updatedAt
    ? new Date(score.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
  const heroTiles = [
    {
      label: "Lead Driver",
      value: leadDriver?.name ?? "—",
      detail: leadDriver ? `${leadDriver.score}` : "—",
    },
    {
      label: "Hot Region",
      value: hottestRegion?.name ?? "—",
      detail: hottestRegion ? `${hottestRegion.score}` : "—",
    },
    {
      label: "Hot Category",
      value: hottestCategory?.name ?? "—",
      detail: hottestCategory ? `${hottestCategory.score}` : "—",
    },
    {
      label: "Alerts",
      value: String(data.alerts.length),
      detail: elevatedCategories > 0 ? `${elevatedCategories} elevated` : "none elevated",
    },
    {
      label: "Coverage",
      value: `${coverage}%`,
      detail: `${populatedSignals}/${totalSignalSlots || 0} slots`,
    },
    {
      label: "Catalyst",
      value: latestCatalyst,
      detail: "",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden noise-bg">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute right-[-180px] top-[220px] h-[380px] w-[380px] rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="pointer-events-none absolute left-[-140px] top-[540px] h-[340px] w-[340px] rounded-full bg-amber-300/10 blur-3xl" />

      <header className="sticky top-0 z-50 border-b border-white/8 bg-slate-950/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] shadow-[0_12px_30px_rgba(2,8,23,0.32)]">
              <div className="absolute inset-1.5 rounded-lg bg-[radial-gradient(circle,rgba(94,234,212,0.28),transparent_72%)]" />
              <div className="relative h-2.5 w-2.5 rounded-full bg-amber-300" />
              <div className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-amber-300/60" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold tracking-[-0.04em] text-white">
                Global Risk Indicator
              </h1>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Last refresh: <span className="text-slate-300">{lastUpdated}</span>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        <section className="relative mb-6 overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(140deg,rgba(7,17,28,0.88),rgba(4,10,17,0.94))] p-4 shadow-[0_30px_90px_rgba(2,8,23,0.42)] md:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(94,234,212,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_30%)]" />
          <div className="relative grid gap-5 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
            <ScoreHero data={score} />

            <div className="flex flex-col gap-4">
              <div className="metric-tile rounded-[28px] p-5 md:p-6">
                <p className="eyebrow mb-3">Current Briefing</p>
                <h2 className="font-display text-2xl font-semibold tracking-[-0.05em] text-white md:text-3xl">
                  {leadDriver?.name ?? "No lead driver"} is setting the tone, with {hottestRegion?.name ?? "no hotspot"} carrying the highest regional stress.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/86">
                  This release reads as a broad-based risk build rather than a single-market anomaly. The highest category pressure is
                  {" "}<span className="text-white">{hottestCategory?.name ?? "unavailable"}</span>, regional average risk is
                  {" "}<span className="text-white">{averageRegionScore}</span>, and the most recent tagged catalyst is
                  {" "}<span className="text-white">{latestCatalyst}</span>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                {heroTiles.map((tile) => (
                  <div key={tile.label} className="metric-tile rounded-xl px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{tile.label}</p>
                    <p className="mt-1 truncate font-display text-sm font-semibold text-white">
                      {tile.value}
                    </p>
                    {tile.detail && (
                      <p className="text-[11px] text-slate-400">{tile.detail}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card colSpan={2} delay={0.05}>
            <TimelineChart timeline={data.timeline} />
          </Card>

          <Card colSpan={2} delay={0.15}>
            <AlertSystem alerts={data.alerts} />
          </Card>

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

          <Card delay={0.3}>
            <MarketOutcomesRadar riskCategories={data.riskCategories} />
          </Card>

          <Card delay={0.35}>
            <RegionalMap regions={data.regions} />
          </Card>

          <Card colSpan={2} delay={0.4}>
            <CategoryMatrix categoryMatrix={data.categoryMatrix} />
          </Card>

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

          <Card colSpan={2} delay={0.5}>
            <SignalExplorer
              indicators={data.indicators}
              riskCategories={data.riskCategories}
              regions={data.regions}
            />
          </Card>
        </div>

        <footer className="mt-8 pb-8 text-center">
          <p className="text-[10px] text-slate-300/70 font-mono">
            GRI v0.2.0 — {data.drivers.length} Drivers → {data.riskCategories.length} Categories → {data.indicators.length} Indicators × {data.regions.length} Regions — {totalSignalSlots} signal slots
          </p>
        </footer>
      </main>
    </div>
  );
}
