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
        relative rounded-2xl border border-card-border bg-card p-5
        hover:border-zinc-700/50 transition-colors
        ${colSpan === 2 ? "col-span-1 lg:col-span-2" : ""}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
