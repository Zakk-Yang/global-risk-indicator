"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRiskColor } from "@/lib/mock-data";
import type { RiskCategory, Indicator, Region } from "@/lib/types";

interface Props {
  riskCategories: RiskCategory[];
  indicators: Indicator[];
  regions: Region[];
}

export default function RiskCategoryPanel({ riskCategories, indicators, regions }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sorted = [...riskCategories].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase">
          Risk Categories
        </h3>
        <span className="text-[10px] text-muted font-mono">Click to expand</span>
      </div>

      {sorted.map((cat, i) => {
        const color = getRiskColor(cat.score);
        const isExpanded = expandedId === cat.id;
        const catIndicators = indicators.filter((ind) => ind.category === cat.id);

        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="cursor-pointer"
            onClick={() => setExpandedId(isExpanded ? null : cat.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {cat.score >= 65 && (
                    <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: color, opacity: 0.3 }} />
                  )}
                </div>
                <span className="text-sm text-zinc-100">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-200">{cat.score}</span>
                <span className="text-[10px] font-mono font-medium" style={{ color: cat.delta > 0 ? "#ef4444" : "#22c55e" }}>
                  +{cat.delta}
                </span>
                <span className="text-[10px] text-zinc-200 ml-1">{isExpanded ? "▲" : "▼"}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-1.5 h-1.5 rounded-full bg-zinc-800/50 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${cat.score}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
              />
            </div>

            {/* Expanded: indicator breakdown by region */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-3">
                    {catIndicators.map((ind) => {
                      // Compute average score across regions
                      const regionEntries = Object.entries(ind.regions);
                      const avgScore = Math.round(regionEntries.reduce((s, [, v]) => s + v.score, 0) / regionEntries.length);
                      const indColor = getRiskColor(avgScore);

                      return (
                        <div key={ind.id} className="mb-3 last:mb-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-medium text-zinc-100">{ind.name}</span>
                            <span className="text-[10px] font-mono" style={{ color: indColor }}>Region avg: {avgScore}</span>
                          </div>
                          {/* Region bars */}
                          <div className="grid grid-cols-6 gap-1">
                            {regions.map((region) => {
                              const rv = ind.regions[region.id];
                              if (!rv) return null;
                              const barColor = getRiskColor(rv.score);
                              return (
                                <div key={region.id} className="flex flex-col items-center gap-0.5">
                                  <div className="w-full h-8 rounded bg-zinc-800/50 relative overflow-hidden flex items-end">
                                    <motion.div
                                      className="w-full rounded-t"
                                      style={{ backgroundColor: barColor }}
                                      initial={{ height: 0 }}
                                      animate={{ height: `${rv.score}%` }}
                                      transition={{ duration: 0.5 }}
                                    />
                                  </div>
                                  <span className="text-[8px] font-mono text-zinc-100">{region.code}</span>
                                  <span className="text-[8px] font-mono" style={{ color: barColor }}>{rv.score}</span>
                                  <span className="text-[7px] text-zinc-200">
                                    {rv.value}{ind.unit !== "idx" ? ind.unit : ""}
                                  </span>
                                  <span className="text-[8px]">
                                    {rv.trend === "rising" ? "↑" : rv.trend === "falling" ? "↓" : "→"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
