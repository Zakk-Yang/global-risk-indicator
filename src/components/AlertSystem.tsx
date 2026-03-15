"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Alert } from "@/lib/types";

const severityConfig = {
  critical: { color: "#ef4444", bg: "#ef444415", border: "#ef444430", icon: "⚠", label: "CRITICAL" },
  warning: { color: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b30", icon: "⚡", label: "WARNING" },
  info: { color: "#3b82f6", bg: "#3b82f610", border: "#3b82f625", icon: "ℹ", label: "INFO" },
};

interface Props {
  alerts: Alert[];
}

export default function AlertSystem({ alerts }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase">
          Risk Alerts
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-[10px] text-muted font-mono">{alerts.length} active</span>
        </div>
      </div>

      <div className="space-y-2">
        {alerts.map((alert, i) => {
          const config = severityConfig[alert.severity];
          const isExpanded = expandedId === alert.id;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border transition-all cursor-pointer"
              style={{ backgroundColor: config.bg, borderColor: isExpanded ? config.color + "60" : config.border }}
              onClick={() => setExpandedId(isExpanded ? null : alert.id)}
            >
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">{config.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-mono font-bold tracking-wider rounded px-1.5 py-0.5"
                          style={{ color: config.color, backgroundColor: `${config.color}20` }}
                        >
                          {config.label}
                        </span>
                        <span className="text-xs font-medium text-zinc-100">{alert.title}</span>
                      </div>
                      <p className="text-[11px] text-zinc-200 mt-1 leading-relaxed">{alert.description}</p>
                      {alert.probability && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-200">Correction probability (30d):</span>
                          <span className="text-[11px] font-mono font-bold" style={{ color: config.color }}>{alert.probability}%</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {alert.drivers.map((d) => (
                          <span key={d} className="text-[9px] font-mono bg-zinc-800/80 text-zinc-200 rounded px-1.5 py-0.5">{d}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] text-zinc-200 whitespace-nowrap font-mono">
                      {new Date(alert.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-[9px] text-zinc-200">
                      {isExpanded ? "▲" : "▼"} {alert.news.length} sources
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded news panel */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: `${config.color}20` }}>
                      <p className="text-[10px] text-zinc-100 font-semibold mb-2 uppercase tracking-wider">Related News</p>
                      <div className="space-y-1.5">
                        {alert.news.map((item, ni) => (
                          <a
                            key={ni}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 group rounded-lg px-2 py-1.5 -mx-1 hover:bg-white/5 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[10px] mt-0.5" style={{ color: config.color }}>→</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-zinc-100 group-hover:text-white leading-snug transition-colors">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-mono text-zinc-200">{item.source}</span>
                                <span className="text-[9px] text-zinc-200">
                                  {new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] text-zinc-200 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">↗</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
