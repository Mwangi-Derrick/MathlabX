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
    <div className="bg-elevated rounded-lg px-4 py-3 border border-border-subtle transition-all hover:border-border-secondary cursor-default">
      <div className="text-[10px] text-text-tertiary mb-1 uppercase tracking-wider font-semibold">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <div className="text-[17px] font-bold text-text-primary font-mono leading-none tracking-tight">{value}</div>
        {unit && <div className="text-[11px] font-bold text-blue-400">{unit}</div>}
      </div>
    </div>
  )
}
