"use client";

import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  delay?: number;
}

export default function Card({ children, className = "", colSpan = 1, delay = 0 }: CardProps) {
  return (
    <motion.div
      className={`
        group relative overflow-hidden rounded-[28px] border border-card-border bg-card p-5
        shadow-[0_18px_45px_rgba(2,8,23,0.34)] backdrop-blur-xl transition-all duration-300
        hover:-translate-y-0.5 hover:border-sky-200/18 hover:bg-card-hover
        ${colSpan === 2 ? "col-span-1 lg:col-span-2" : ""}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(94,234,212,0.08),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.08),transparent_32%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
