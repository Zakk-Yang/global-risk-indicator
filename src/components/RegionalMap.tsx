"use client";

import { motion } from "framer-motion";
import { getRiskColor } from "@/lib/mock-data";
import { useState } from "react";
import type { Region } from "@/lib/types";

interface Props {
  regions: Region[];
}

export default function RegionalMap({ regions }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const sorted = [...regions].sort((a, b) => b.score - a.score);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase">
          Regional Risk
        </h3>
        <span className="text-[10px] text-muted font-mono">Geographic breakdown</span>
      </div>

      {/* Hex grid map visualization */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {sorted.map((region, i) => {
          const color = getRiskColor(region.score);
          const isSelected = selected === region.id;
          return (
            <motion.button
              key={region.id}
              onClick={() => setSelected(isSelected ? null : region.id)}
              className="relative rounded-xl p-3 text-left transition-all border"
              style={{
                backgroundColor: isSelected ? `${color}15` : "#111118",
                borderColor: isSelected ? `${color}40` : "#1e1e2a",
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Glow on high risk */}
              {region.score >= 70 && (
                <div
                  className="absolute inset-0 rounded-xl opacity-20 blur-xl"
                  style={{ backgroundColor: color }}
                />
              )}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-zinc-100">{region.code}</span>
                  <span
                    className="text-[10px] font-mono font-medium"
                    style={{ color: region.delta > 0 ? "#ef4444" : "#22c55e" }}
                  >
                    {region.delta > 0 ? "+" : ""}{region.delta}
                  </span>
                </div>
                <div className="text-2xl font-bold tabular-nums" style={{ color }}>
                  {region.score}
                </div>
                <div className="text-[10px] text-zinc-100 mt-0.5 truncate">
                  {region.name}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected detail */}
      {selected && (() => {
        const r = regions.find((r) => r.id === selected);
        if (!r) return null;
        return (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-lg bg-zinc-900/50 border border-zinc-800 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-100">{r.name}</span>
              <span className="text-lg font-bold" style={{ color: getRiskColor(r.score) }}>
                {r.score}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-100">
              Top driver: <span className="text-zinc-200">{r.topDriver}</span>
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
}
