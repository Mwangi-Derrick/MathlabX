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
    <div className="bg-secondary rounded-md px-3 py-2.5 transition-colors hover:bg-elevated">
      <div className="text-[10px] text-text-tertiary mb-[3px] uppercase tracking-[0.06em]">{label}</div>
      <div className="text-[18px] font-medium text-text-primary font-mono leading-[1.2]">{value}</div>
      {unit && <div className="text-[10px] text-text-secondary mt-[2px]">{unit}</div>}
    </div>
  )
}
