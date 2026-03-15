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
  const circumference = 2 * Math.PI * 77;
  const deltaLabel =
    delta === 0 ? "Flat month over month" : delta > 0 ? `+${delta} vs last month` : `${delta} vs last month`;
  const deltaTone = delta === 0 ? "#94a3b8" : delta > 0 ? "#f87171" : "#4ade80";
  const progress = circumference * (1 - current / 100);

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(145deg,rgba(8,18,31,0.94),rgba(4,10,18,0.92))] px-5 py-5 md:px-6 md:py-5">
      <div
        className="pointer-events-none absolute -left-10 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: `${color}22` }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative flex flex-col gap-4">
        <div className="relative mx-auto flex h-[200px] w-[200px] items-center justify-center">
          <div className="absolute inset-4 rounded-full border border-white/6 bg-white/[0.02]" />
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="77" fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="1" />
            <circle cx="100" cy="100" r="87" fill="none" stroke="rgba(148,163,184,0.09)" strokeWidth="10" />
            <circle
              cx="100"
              cy="100"
              r="77"
              fill="none"
              stroke="rgba(148,163,184,0.12)"
              strokeWidth="10"
            />
            <motion.circle
              cx="100"
              cy="100"
              r="77"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={progress}
              transform="rotate(-90 100 100)"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: progress }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
            <motion.circle
              cx="100"
              cy="100"
              r="77"
              fill="none"
              stroke={color}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={progress}
              transform="rotate(-90 100 100)"
              opacity="0.16"
              filter="blur(8px)"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: progress }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="eyebrow">Global Risk</span>
            <motion.span
              className="font-display text-6xl font-semibold tabular-nums tracking-[-0.05em]"
              style={{ color }}
              initial={{ opacity: 0, scale: 0.55 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.25 }}
            >
              {current}
            </motion.span>
            <span className="text-[11px] uppercase tracking-[0.28em] text-slate-300/75">
              Composite Score
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{
              backgroundColor: `${color}15`,
              color,
              border: `1px solid ${color}35`,
            }}
          >
            {regime}
          </span>
          <span className="text-sm font-medium" style={{ color: deltaTone }}>
            {deltaLabel}
          </span>
        </div>

        <motion.div
          className="grid grid-cols-3 gap-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="metric-tile rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Rank</p>
            <p className="font-display text-lg font-semibold text-white">{percentile}<span className="text-sm text-slate-400">th</span></p>
          </div>
          <div className="metric-tile rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Delta</p>
            <p className="font-display text-lg font-semibold" style={{ color: deltaTone }}>
              {delta > 0 ? "+" : ""}{delta}
            </p>
          </div>
          <div className="metric-tile rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Band</p>
            <p className="font-display text-lg font-semibold text-white">{Math.floor(current / 10) * 10}s</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
