"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRiskColor } from "@/lib/mock-data";
import type { NetworkNode, NetworkEdge, Driver, RiskCategory, Indicator, Region } from "@/lib/types";

interface Props {
  networkNodes: NetworkNode[];
  networkEdges: NetworkEdge[];
  drivers: Driver[];
  riskCategories: RiskCategory[];
  indicators: Indicator[];
  regions: Region[];
}

export default function NetworkGraph({ networkNodes, networkEdges, drivers, riskCategories, indicators, regions }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 380 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Get the risk category data for the selected node
  const selectedCategory = selectedNode
    ? riskCategories.find((c) => `n-${c.id}` === selectedNode)
    : null;
  const selectedDriver = selectedNode
    ? drivers.find((d) => `n-${d.id}` === selectedNode)
    : null;
  const selectedIndicators = selectedCategory
    ? indicators.filter((ind) => ind.category === selectedCategory.id)
    : [];

  const renderGraph = useCallback(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const { width, height } = dimensions;
    const padX = 100;
    const padY = 50;
    const ns = "http://www.w3.org/2000/svg";

    const driverNodes = networkNodes.filter((n) => n.type === "driver");
    const catNodes = networkNodes.filter((n) => n.type === "category");

    const colDriver = padX;
    const colCategory = width - padX;

    interface Pos { cx: number; cy: number; rx: number; ry: number }
    const positions = new Map<string, Pos>();

    const layoutColumn = (nodes: typeof networkNodes, cx: number) => {
      const spacing = (height - padY * 2) / (nodes.length + 1);
      nodes.forEach((n, i) => {
        positions.set(n.id, { cx, cy: padY + spacing * (i + 1), rx: 58, ry: 22 });
      });
    };

    layoutColumn(driverNodes, colDriver);
    layoutColumn(catNodes, colCategory);

    // --- Defs ---
    const defs = document.createElementNS(ns, "defs");

    const glowFilter = document.createElementNS(ns, "filter");
    glowFilter.setAttribute("id", "glow");
    glowFilter.setAttribute("x", "-50%");
    glowFilter.setAttribute("y", "-50%");
    glowFilter.setAttribute("width", "200%");
    glowFilter.setAttribute("height", "200%");
    const blur = document.createElementNS(ns, "feGaussianBlur");
    blur.setAttribute("stdDeviation", "4");
    blur.setAttribute("result", "blur");
    glowFilter.appendChild(blur);
    const merge = document.createElementNS(ns, "feMerge");
    ["blur", "SourceGraphic"].forEach((inp) => {
      const mn = document.createElementNS(ns, "feMergeNode");
      mn.setAttribute("in", inp);
      merge.appendChild(mn);
    });
    glowFilter.appendChild(merge);
    defs.appendChild(glowFilter);

    [
      { id: "arr-red", color: "#ef4444" },
      { id: "arr-amber", color: "#f59e0b" },
      { id: "arr-green", color: "#22c55e" },
    ].forEach(({ id, color }) => {
      const marker = document.createElementNS(ns, "marker");
      marker.setAttribute("id", id);
      marker.setAttribute("viewBox", "0 -4 8 8");
      marker.setAttribute("refX", "8");
      marker.setAttribute("refY", "0");
      marker.setAttribute("markerWidth", "6");
      marker.setAttribute("markerHeight", "6");
      marker.setAttribute("orient", "auto");
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", "M0,-4L8,0L0,4");
      path.setAttribute("fill", color);
      path.setAttribute("opacity", "0.8");
      marker.appendChild(path);
      defs.appendChild(marker);
    });
    svg.appendChild(defs);

    // --- Headers ---
    [
      { label: "DRIVERS", sub: "Root Causes", x: colDriver },
      { label: "RISK CATEGORIES", sub: "Click to explore signals", x: colCategory },
    ].forEach(({ label, sub, x }) => {
      const t = document.createElementNS(ns, "text");
      t.setAttribute("x", String(x));
      t.setAttribute("y", "20");
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("fill", "#d4d4d8");
      t.setAttribute("font-size", "10");
      t.setAttribute("font-weight", "600");
      t.setAttribute("letter-spacing", "0.12em");
      t.textContent = label;
      svg.appendChild(t);

      const s = document.createElementNS(ns, "text");
      s.setAttribute("x", String(x));
      s.setAttribute("y", "32");
      s.setAttribute("text-anchor", "middle");
      s.setAttribute("fill", "#a1a1aa");
      s.setAttribute("font-size", "8");
      s.textContent = sub;
      svg.appendChild(s);
    });

    // --- Edges ---
    const activeNode = hoveredNode || selectedNode;
    const edgeGroup = document.createElementNS(ns, "g");

    networkEdges.forEach((edge) => {
      const src = positions.get(edge.source);
      const tgt = positions.get(edge.target);
      if (!src || !tgt) return;

      const srcNode = networkNodes.find((n) => n.id === edge.source);
      const srcColor = srcNode ? getRiskColor(srcNode.score) : "#f59e0b";
      const markerId = srcColor === "#ef4444" ? "arr-red" : srcColor === "#f59e0b" ? "arr-amber" : "arr-green";
      const isConnected = activeNode ? edge.source === activeNode || edge.target === activeNode : true;

      const x1 = src.cx + src.rx;
      const y1 = src.cy;
      const x2 = tgt.cx - tgt.rx - 10;
      const y2 = tgt.cy;
      const cpOffset = (x2 - x1) * 0.4;
      const d = `M${x1},${y1} C${x1 + cpOffset},${y1} ${x2 - cpOffset},${y2} ${x2},${y2}`;

      const gp = document.createElementNS(ns, "path");
      gp.setAttribute("d", d);
      gp.setAttribute("fill", "none");
      gp.setAttribute("stroke", srcColor);
      gp.setAttribute("stroke-width", String(edge.weight * 6));
      gp.setAttribute("opacity", isConnected ? "0.1" : "0.02");
      gp.setAttribute("filter", "url(#glow)");
      edgeGroup.appendChild(gp);

      const p = document.createElementNS(ns, "path");
      p.setAttribute("d", d);
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", srcColor);
      p.setAttribute("stroke-width", String(Math.max(edge.weight * 2.5, 1.2)));
      p.setAttribute("opacity", isConnected ? "0.65" : "0.08");
      p.setAttribute("marker-end", `url(#${markerId})`);
      p.setAttribute("stroke-linecap", "round");
      edgeGroup.appendChild(p);
    });
    svg.appendChild(edgeGroup);

    // --- Nodes ---
    const nodeGroup = document.createElementNS(ns, "g");

    networkNodes.forEach((node) => {
      const pos = positions.get(node.id);
      if (!pos) return;
      const color = getRiskColor(node.score);
      const isActive = !activeNode || activeNode === node.id ||
        networkEdges.some(
          (e) => (e.source === activeNode && e.target === node.id) ||
                 (e.target === activeNode && e.source === node.id)
        );
      const isSelected = selectedNode === node.id;
      const driverData = drivers.find((d) => `n-${d.id}` === node.id);
      const nodeColor = driverData ? driverData.color : color;

      const g = document.createElementNS(ns, "g");
      g.setAttribute("cursor", "pointer");
      g.setAttribute("opacity", isActive ? "1" : "0.25");
      g.addEventListener("mouseenter", () => setHoveredNode(node.id));
      g.addEventListener("mouseleave", () => setHoveredNode(null));
      g.addEventListener("click", () => setSelectedNode(isSelected ? null : node.id));

      // Glow
      const glow = document.createElementNS(ns, "ellipse");
      glow.setAttribute("cx", String(pos.cx));
      glow.setAttribute("cy", String(pos.cy));
      glow.setAttribute("rx", String(pos.rx + 4));
      glow.setAttribute("ry", String(pos.ry + 4));
      glow.setAttribute("fill", nodeColor);
      glow.setAttribute("opacity", isSelected ? "0.25" : hoveredNode === node.id ? "0.15" : "0.06");
      glow.setAttribute("filter", "url(#glow)");
      g.appendChild(glow);

      // Ellipse
      const ell = document.createElementNS(ns, "ellipse");
      ell.setAttribute("cx", String(pos.cx));
      ell.setAttribute("cy", String(pos.cy));
      ell.setAttribute("rx", String(pos.rx));
      ell.setAttribute("ry", String(pos.ry));
      ell.setAttribute("fill", `${nodeColor}15`);
      ell.setAttribute("stroke", nodeColor);
      ell.setAttribute("stroke-width", isSelected ? "2.5" : hoveredNode === node.id ? "2" : "1.2");
      g.appendChild(ell);

      // Label
      const text = document.createElementNS(ns, "text");
      text.setAttribute("x", String(pos.cx));
      text.setAttribute("y", String(pos.cy - 2));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "#e4e4e7");
      text.setAttribute("font-size", "9");
      text.setAttribute("font-weight", "600");
      text.textContent = node.label;
      g.appendChild(text);

      // Score badge
      const badgeX = pos.cx + pos.rx - 12;
      const badgeY = pos.cy - pos.ry + 2;
      const badge = document.createElementNS(ns, "rect");
      badge.setAttribute("x", String(badgeX - 10));
      badge.setAttribute("y", String(badgeY - 7));
      badge.setAttribute("width", "20");
      badge.setAttribute("height", "13");
      badge.setAttribute("rx", "3");
      badge.setAttribute("fill", `${color}30`);
      g.appendChild(badge);

      const scoreText = document.createElementNS(ns, "text");
      scoreText.setAttribute("x", String(badgeX));
      scoreText.setAttribute("y", String(badgeY + 3));
      scoreText.setAttribute("text-anchor", "middle");
      scoreText.setAttribute("fill", color);
      scoreText.setAttribute("font-size", "8");
      scoreText.setAttribute("font-weight", "700");
      scoreText.setAttribute("font-family", "monospace");
      scoreText.textContent = String(node.score);
      g.appendChild(scoreText);

      nodeGroup.appendChild(g);
    });
    svg.appendChild(nodeGroup);
  }, [dimensions, hoveredNode, selectedNode, networkNodes, networkEdges, drivers]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ width: Math.max(entry.contentRect.width, 500), height: 380 });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { renderGraph(); }, [renderGraph]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase">
          Risk Propagation Network
        </h3>
        <span className="text-[10px] text-muted font-mono">Click nodes to inspect</span>
      </div>

      <div ref={containerRef} className="w-full rounded-lg border border-zinc-800/50 bg-zinc-950/50 overflow-hidden">
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full" />
      </div>

      {/* Signal detail panel below the graph */}
      <AnimatePresence>
        {(selectedCategory || selectedDriver) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl border border-zinc-800/50 bg-zinc-900/60 p-4">
              {/* Category detail */}
              {selectedCategory && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getRiskColor(selectedCategory.score) }} />
                      <span className="text-sm font-semibold text-zinc-100">{selectedCategory.name}</span>
                      <span className="text-sm font-mono font-bold" style={{ color: getRiskColor(selectedCategory.score) }}>
                        {selectedCategory.score}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-[10px] text-zinc-200 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-800"
                    >
                      ✕ Close
                    </button>
                  </div>

                  {/* Indicator table */}
                  <div className="overflow-x-auto rounded-lg border border-zinc-800/30">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-zinc-800/40">
                          <th className="text-left py-1.5 px-2 text-zinc-100 font-medium">Indicator</th>
                          {regions.map((r) => (
                            <th key={r.id} className="text-center py-1.5 px-2 text-zinc-100 font-medium font-mono">{r.code}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedIndicators.map((ind) => (
                          <tr key={ind.id} className="border-t border-zinc-800/20">
                            <td className="py-1.5 px-2 text-zinc-100 font-medium whitespace-nowrap">{ind.name}</td>
                            {regions.map((r) => {
                              const rv = ind.regions[r.id];
                              if (!rv) return <td key={r.id} className="text-center py-1.5 px-2 text-zinc-200">—</td>;
                              const c = getRiskColor(rv.score);
                              return (
                                <td key={r.id} className="text-center py-1.5 px-2">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="font-mono font-medium" style={{ color: c }}>{rv.score}</span>
                                    <span className="text-[9px] text-zinc-200">
                                      {rv.value}{ind.unit !== "idx" ? ind.unit : ""}
                                    </span>
                                    <span className="text-[9px]">
                                      {rv.trend === "rising" ? "↑" : rv.trend === "falling" ? "↓" : "→"}
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Interpretation */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedIndicators.map((ind) => {
                      const scores = Object.values(ind.regions).map((rv) => rv.score);
                      const maxScore = Math.max(...scores);
                      const maxRegion = Object.entries(ind.regions).find(([, rv]) => rv.score === maxScore);
                      const regionName = maxRegion ? regions.find((r) => r.id === maxRegion[0])?.code : "?";
                      const color = getRiskColor(maxScore);
                      return (
                        <div key={ind.id} className="rounded-lg bg-zinc-800/40 border border-zinc-700/30 px-2.5 py-1.5">
                          <span className="text-[10px] text-zinc-100">{ind.name}</span>
                          <span className="text-[10px] text-zinc-200 mx-1">→</span>
                          <span className="text-[10px] font-mono font-medium" style={{ color }}>
                            highest in {regionName} ({maxScore})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Driver detail */}
              {selectedDriver && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedDriver.color }} />
                      <span className="text-sm font-semibold text-zinc-100">{selectedDriver.name}</span>
                      <span className="text-sm font-mono font-bold" style={{ color: selectedDriver.color }}>
                        {selectedDriver.score}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-[10px] text-zinc-200 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-800"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 mb-2">{selectedDriver.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-zinc-100 mr-1">Affects:</span>
                    {selectedDriver.categories.map((catId) => {
                      const cat = riskCategories.find((c) => c.id === catId);
                      if (!cat) return null;
                      const catColor = getRiskColor(cat.score);
                      return (
                        <span
                          key={catId}
                          className="text-[10px] font-mono rounded px-1.5 py-0.5 cursor-pointer hover:brightness-125 transition-all"
                          style={{ backgroundColor: `${catColor}20`, color: catColor, border: `1px solid ${catColor}30` }}
                          onClick={() => setSelectedNode(`n-${catId}`)}
                        >
                          {cat.name} ({cat.score})
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
