"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { getRiskColor } from "@/lib/mock-data";
import type { TimelinePoint } from "@/lib/types";

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string; score: number; event?: string } }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-200">{d.date}</p>
      <p className="text-lg font-bold" style={{ color: getRiskColor(d.score) }}>
        {d.score}
      </p>
      {d.event && (
        <p className="text-[10px] text-amber-400 mt-0.5">{d.event}</p>
      )}
    </div>
  );
}

interface Props {
  timeline: TimelinePoint[];
}

export default function TimelineChart({ timeline }: Props) {
  const series = timeline.slice(-12);
  const latestScore = series[series.length - 1]?.score ?? 50;
  const color = getRiskColor(latestScore);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase">
          GRI Timeline
        </h3>
        <span className="text-[10px] text-muted font-mono">
          Trailing {series.length}-month trend
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={series} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <defs>
            <linearGradient id="gri-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#d4d4d8", fontSize: 10 }}
          />
          <YAxis
            domain={[30, 80]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#d4d4d8", fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2}
            fill="url(#gri-gradient)"
          />
          {/* Event markers */}
          {series
            .filter((p) => p.event)
            .map((p) => (
              <ReferenceDot
                key={p.date}
                x={p.date}
                y={p.score}
                r={4}
                fill="#f59e0b"
                stroke="#0a0a0f"
                strokeWidth={2}
              />
            ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Event legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {series
          .filter((p) => p.event)
          .map((p) => (
            <div key={p.date} className="flex items-center gap-1.5 text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-zinc-100">{p.date}:</span>
              <span className="text-zinc-200">{p.event}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
