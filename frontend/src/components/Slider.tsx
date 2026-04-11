/**
 * Slider — custom-styled range input for controlling engine parameters.
 * Each slider's value is piped directly to the C++ WASM engine.
 */

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
  formatValue = (val) => String(val),
}) => {
  return (
    <div className="mb-[14px]">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[12px] text-text-secondary font-medium">{label}</span>
        <span className="text-[12px] font-medium text-text-primary font-mono">{formatValue(value)}</span>
      </div>
      <input
        type="range"
        className="w-full h-1 bg-border-primary rounded-sm appearance-none cursor-pointer outline-none accent-blue-500"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  )
}
