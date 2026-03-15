"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { Driver } from "@/lib/types";

interface Props {
  drivers: Driver[];
}

export default function DriverPanel({ drivers }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = [...drivers].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...sorted.map((d) => d.score));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase">
          Top Drivers
        </h3>
        <span className="text-[10px] text-muted font-mono">Root Causes</span>
      </div>

      {sorted.map((driver, i) => (
        <motion.div
          key={driver.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="group cursor-pointer"
          onClick={() => setExpanded(expanded === driver.id ? null : driver.id)}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: driver.color }}
              />
              <span className="text-sm text-zinc-100 group-hover:text-white transition-colors">
                {driver.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-200">{driver.score}</span>
              <span
                className="text-[10px] font-mono font-medium"
                style={{ color: driver.delta > 0 ? "#ef4444" : "#22c55e" }}
              >
                {driver.delta > 0 ? "+" : ""}{driver.delta}
              </span>
            </div>
          </div>

          {/* Bar */}
          <div className="relative h-2 rounded-full bg-zinc-800/50 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ backgroundColor: driver.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(driver.score / maxScore) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full opacity-30 blur-sm"
              style={{ backgroundColor: driver.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(driver.score / maxScore) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
            />
          </div>

          {/* Expanded detail */}
          {expanded === driver.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 pl-4 border-l border-zinc-700/50"
            >
              <p className="text-xs text-zinc-200 mb-1.5">{driver.description}</p>
              <p className="text-[10px] text-zinc-100 mb-1">Affects:</p>
              {driver.categories.map((c) => (
                <span
                  key={c}
                  className="inline-block text-[10px] font-mono bg-zinc-800 text-zinc-200 rounded px-1.5 py-0.5 mr-1 mb-1"
                >
                  {c}
                </span>
              ))}
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
