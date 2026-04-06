import React from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit }) => {
  return (
    <div className="bg-cet-slate-700 rounded-md p-3">
      <div className="text-xs text-cet-slate-500 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-lg font-mono font-semibold text-cet-slate-100">{value}</div>
      {unit && <div className="text-xs text-cet-slate-400 mt-1">{unit}</div>}
    </div>
  )
}
