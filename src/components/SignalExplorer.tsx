"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRiskColor } from "@/lib/mock-data";
import type { Indicator, RiskCategory, Region } from "@/lib/types";

interface FlatSignal {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  region: string;
  regionName: string;
  value: number;
  unit: string;
  score: number;
  zScore: number;
  trend: "rising" | "falling" | "stable";
}

interface Props {
  indicators: Indicator[];
  riskCategories: RiskCategory[];
  regions: Region[];
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  return (
    <span className={`ml-0.5 text-[9px] ${active ? "text-zinc-100" : "text-zinc-500"}`}>
      {active ? (dir === "desc" ? "▼" : "▲") : "⇕"}
    </span>
  );
}

export default function SignalExplorer({ indicators, riskCategories, regions }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"score" | "zScore" | "name">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");

  // Flatten indicators × regions into a flat list
  const flatSignals: FlatSignal[] = useMemo(() => {
    const result: FlatSignal[] = [];
    for (const ind of indicators) {
      const cat = riskCategories.find((c) => c.id === ind.category);
      for (const [regionId, rv] of Object.entries(ind.regions)) {
        const region = regions.find((r) => r.id === regionId);
        result.push({
          id: `${ind.id}-${regionId}`,
          name: ind.name,
          category: ind.category,
          categoryName: cat?.name ?? ind.category,
          region: regionId,
          regionName: region?.code ?? regionId.toUpperCase(),
          value: rv.value,
          unit: ind.unit,
          score: rv.score,
          zScore: rv.zScore,
          trend: rv.trend,
        });
      }
    }
    return result;
  }, [indicators, riskCategories, regions]);

  const filtered = useMemo(() => {
    let result = [...flatSignals];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.categoryName.toLowerCase().includes(q) ||
          s.regionName.toLowerCase().includes(q)
      );
    }

    if (filterCategory !== "all") {
      result = result.filter((s) => s.category === filterCategory);
    }
    if (filterRegion !== "all") {
      result = result.filter((s) => s.region === filterRegion);
    }

    result.sort((a, b) => {
      const mul = sortDir === "desc" ? -1 : 1;
      if (sortKey === "name") return mul * a.name.localeCompare(b.name);
      return mul * (a[sortKey] - b[sortKey]);
    });

    return result;
  }, [search, sortKey, sortDir, filterCategory, filterRegion, flatSignals]);

  const handleSort = (key: "score" | "zScore" | "name") => {
    if (sortKey === key) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase">
          Indicator Explorer
        </h3>
        <span className="text-[10px] text-muted font-mono">
          {filtered.length} of {flatSignals.length} signals
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <input
          type="text"
          placeholder="Search indicators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-600 transition-colors"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-zinc-600 cursor-pointer"
        >
          <option value="all">All categories</option>
          {riskCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-zinc-600 cursor-pointer"
        >
          <option value="all">All regions</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.code} — {r.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-800/50">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-900/80">
              <th
                className="text-left py-2 px-3 text-zinc-100 font-medium cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("name")}
              >
                Indicator <SortIcon active={sortKey === "name"} dir={sortDir} />
              </th>
              <th className="text-left py-2 px-3 text-zinc-100 font-medium">Region</th>
              <th className="text-right py-2 px-3 text-zinc-100 font-medium">Value</th>
              <th
                className="text-right py-2 px-3 text-zinc-100 font-medium cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("score")}
              >
                Score <SortIcon active={sortKey === "score"} dir={sortDir} />
              </th>
              <th
                className="text-right py-2 px-3 text-zinc-100 font-medium cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("zScore")}
              >
                Z-Score <SortIcon active={sortKey === "zScore"} dir={sortDir} />
              </th>
              <th className="text-left py-2 px-3 text-zinc-100 font-medium">Category</th>
              <th className="text-center py-2 px-3 text-zinc-100 font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.slice(0, 50).map((signal, i) => {
                const color = getRiskColor(signal.score);
                return (
                  <motion.tr
                    key={signal.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.01 }}
                    className="border-t border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="py-2 px-3 text-zinc-100 font-medium whitespace-nowrap">
                      {signal.name}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-mono bg-zinc-800 text-zinc-200 rounded px-1.5 py-0.5">
                        {signal.regionName}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-zinc-200">
                      {signal.value}{signal.unit !== "idx" ? signal.unit : ""}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span
                        className="inline-block font-mono font-medium rounded px-1.5 py-0.5"
                        style={{ color, backgroundColor: `${color}15` }}
                      >
                        {signal.score}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono" style={{ color }}>
                      {signal.zScore > 0 ? "+" : ""}{signal.zScore.toFixed(1)}σ
                    </td>
                    <td className="py-2 px-3 text-zinc-200 whitespace-nowrap text-[10px]">
                      {signal.categoryName}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-sm" title={signal.trend}>
                        {signal.trend === "rising" ? "↑" : signal.trend === "falling" ? "↓" : "→"}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
