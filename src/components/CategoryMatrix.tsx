"use client";

import { motion } from "framer-motion";
import { getRiskColor } from "@/lib/mock-data";
import { useState } from "react";
import type { CategoryMatrix as CategoryMatrixType } from "@/lib/types";

interface Props {
  categoryMatrix: CategoryMatrixType;
}

export default function CategoryMatrix({ categoryMatrix }: Props) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const { drivers, categories, values } = categoryMatrix;

  const maxVal = Math.max(...values.flat());
  const minVal = Math.min(...values.flat());

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase">
          Driver × Category Matrix
        </h3>
        <span className="text-[10px] text-muted font-mono">Propagation heatmap</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-[10px] font-mono text-zinc-200 pb-2 pr-3 w-36" />
              {categories.map((c) => (
                <th
                  key={c}
                  className="text-center text-[10px] font-mono text-zinc-100 pb-2 px-1"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver, ri) => (
              <tr key={driver}>
                <td className="text-left text-[11px] text-zinc-200 pr-3 py-0.5 whitespace-nowrap max-w-[140px] truncate" title={driver}>
                  {driver}
                </td>
                {values[ri].map((val, ci) => {
                  const color = getRiskColor(val);
                  const intensity = (val - minVal) / (maxVal - minVal);
                  const isHovered =
                    hoveredCell?.row === ri || hoveredCell?.col === ci;
                  const isCellHovered =
                    hoveredCell?.row === ri && hoveredCell?.col === ci;

                  return (
                    <td key={ci} className="p-0.5">
                      <motion.div
                        className="relative flex items-center justify-center rounded-md cursor-pointer transition-all"
                        style={{
                          backgroundColor: `${color}${Math.round(intensity * 40 + 10).toString(16).padStart(2, "0")}`,
                          border: isCellHovered
                            ? `1px solid ${color}80`
                            : "1px solid transparent",
                          opacity: hoveredCell && !isHovered ? 0.3 : 1,
                        }}
                        onMouseEnter={() => setHoveredCell({ row: ri, col: ci })}
                        onMouseLeave={() => setHoveredCell(null)}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: hoveredCell && !isHovered ? 0.3 : 1, scale: 1 }}
                        transition={{ delay: ri * 0.05 + ci * 0.03 }}
                      >
                        <span
                          className="text-xs font-mono py-2 font-medium"
                          style={{ color: isCellHovered ? color : `${color}cc` }}
                        >
                          {val}
                        </span>
                      </motion.div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Color legend */}
      <div className="flex items-center justify-end gap-2 mt-3">
        <span className="text-[10px] text-zinc-200">Low</span>
        <div className="flex gap-0.5">
          {[30, 40, 50, 60, 70, 80].map((v) => (
            <div
              key={v}
              className="w-4 h-2 rounded-sm"
              style={{ backgroundColor: `${getRiskColor(v)}60` }}
            />
          ))}
        </div>
        <span className="text-[10px] text-zinc-200">High</span>
      </div>
    </div>
  );
}
