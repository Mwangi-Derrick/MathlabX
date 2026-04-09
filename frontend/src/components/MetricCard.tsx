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
    <div style={{backgroundColor: "#edf1f5" }} className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {unit && <div className="metric-label">{unit}</div>}
    </div>
  )
}
