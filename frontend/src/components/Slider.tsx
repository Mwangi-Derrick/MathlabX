import React from 'react'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  formatValue?: (val: number) => string
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue = (val) => val.toFixed(2),
}) => {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs text-cet-slate-400 font-medium">{label}</label>
        <span className="text-xs font-mono text-cet-slate-300">{formatValue(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-cet-slate-700 rounded-lg appearance-none cursor-pointer accent-cet-blue-600"
      />
    </div>
  )
}
