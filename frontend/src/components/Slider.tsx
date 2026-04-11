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
      <div className="flex justify-between items-center mb-3">
        <span className="text-[12px] text-text-secondary font-medium tracking-wide">{label}</span>
        <span className="text-[12px] font-bold text-blue-500 font-mono tracking-widest bg-secondary px-2.5 py-1 rounded shadow-inner border border-border-secondary">{formatValue(value)}</span>
      </div>
      <div className="relative flex items-center py-2 cursor-pointer touch-none group">
        <input
          type="range"
          className="w-full h-2 bg-border-secondary rounded-full appearance-none cursor-pointer outline-none accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 touch-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.5)] [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all group-active:[&::-webkit-slider-thumb]:scale-150 group-active:[&::-moz-range-thumb]:scale-150"
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
