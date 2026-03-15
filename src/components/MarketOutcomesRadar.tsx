"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { getRiskColor } from "@/lib/mock-data";
import type { RiskCategory } from "@/lib/types";

interface Props {
  riskCategories: RiskCategory[];
}

export default function MarketOutcomesRadar({ riskCategories }: Props) {
  const data = riskCategories.map((c) => ({
    name: c.name.replace(" Stress", "").replace(" & ", "/"),
    score: c.score,
    fullMark: 100,
  }));

  const avgScore = Math.round(
    riskCategories.reduce((s, c) => s + c.score, 0) / riskCategories.length
  );
  const color = getRiskColor(avgScore);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase">
          Risk Category Radar
        </h3>
        <span className="text-[10px] text-muted font-mono">5 categories</span>
      </div>

      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="65%">
            <PolarGrid stroke="#27272a" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: "#d4d4d8", fontSize: 10 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#d4d4d8", fontSize: 9 }}
              axisLine={false}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke={color}
              fill={color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
        {riskCategories.map((c) => (
          <div key={c.id} className="flex items-center justify-between text-xs">
            <span className="text-zinc-200 truncate">{c.name}</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-zinc-100">{c.score}</span>
              <span
                className="text-[10px] font-mono"
                style={{ color: c.delta > 0 ? "#ef4444" : "#22c55e" }}
              >
                +{c.delta}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
