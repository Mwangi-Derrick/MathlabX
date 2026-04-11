/**
 * MetricCard — displays a single computed metric (e.g., Vmax, Vrms).
 * Used in the right panel to show real-time values from the WASM engine.
 */

import React from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit }) => {
  return (
    <div className="bg-secondary rounded-lg px-4 py-3 border border-border-secondary shadow-inner transition-all hover:bg-elevated hover:border-border-primary group cursor-default">
      <div className="text-[10px] text-text-tertiary mb-1 uppercase tracking-wider font-semibold group-hover:text-text-secondary transition-colors">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <div className="text-[18px] font-bold text-text-primary font-mono leading-none tracking-tight">{value}</div>
        {unit && <div className="text-[12px] font-bold text-blue-500 mb-0.5">{unit}</div>}
      </div>
    </div>
  )
}
