"use client";

import { motion } from "framer-motion";
import { getRiskColor } from "@/lib/mock-data";
import type { GlobalRiskScore } from "@/lib/types";

interface Props {
  data: GlobalRiskScore;
}

export default function ScoreHero({ data }: Props) {
  const { current, delta, regime, percentile } = data;
  const color = getRiskColor(current);

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* Background glow */}
      <div
        className="absolute inset-0 rounded-3xl opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle, ${color}40 0%, transparent 70%)` }}
      />

      {/* Score ring */}
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Track */}
          <circle
            cx="100" cy="100" r="85"
            fill="none"
            stroke="#1e1e2a"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <motion.circle
            cx="100" cy="100" r="85"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 85}`}
            strokeDashoffset={2 * Math.PI * 85 * (1 - current / 100)}
            transform="rotate(-90 100 100)"
            initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - current / 100) }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          {/* Glow overlay */}
          <motion.circle
            cx="100" cy="100" r="85"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 85}`}
            strokeDashoffset={2 * Math.PI * 85 * (1 - current / 100)}
            transform="rotate(-90 100 100)"
            opacity="0.2"
            filter="blur(4px)"
            initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - current / 100) }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>

        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-6xl font-bold tabular-nums tracking-tight"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {current}
          </motion.span>
          <span className="text-xs font-medium tracking-widest uppercase text-muted">
            GRI Score
          </span>
        </div>
      </div>

      {/* Regime badge + delta */}
      <motion.div
        className="mt-5 flex items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: `${color}20`,
            color,
            border: `1px solid ${color}40`,
          }}
        >
          {regime}
        </span>
        <span className="flex items-center gap-1 text-sm font-medium" style={{ color: delta > 0 ? "#ef4444" : "#22c55e" }}>
          {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
          <span className="text-muted text-xs ml-1">vs last month</span>
        </span>
      </motion.div>

      {/* Percentile */}
      <motion.p
        className="mt-2 text-xs text-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {percentile}th percentile (historical)
      </motion.p>
    </div>
  );
}
