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
    <div className="px-4 py-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[12px] text-text-secondary font-medium tracking-wide">{label}</span>
        <span className="text-[12px] font-bold text-blue-400 font-mono tracking-wider">{formatValue(value)}</span>
      </div>
      <div className="relative flex items-center py-1 cursor-pointer touch-none group">
        <input
          type="range"
          className="w-full"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </div>
    </div>
  )
}
