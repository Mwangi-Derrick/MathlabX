/**
 * ToggleButton — wave mode selector (sin / cos / both).
 * Each mode has a distinct color to match the waveform rendering.
 */

import React from 'react'

interface ToggleButtonProps {
  label: string
  isActive: boolean
  onClick: () => void
  variant?: 'sin' | 'cos' | 'both'
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  label,
  isActive,
  onClick,
  variant = 'sin',
}) => {
  let activeTailwind = '';
  if (isActive) {
    if (variant === 'sin') activeTailwind = 'bg-blue-50 !border-blue-600 !text-blue-900 !hover:bg-blue-50';
    if (variant === 'cos') activeTailwind = 'bg-green-50 !border-green-600 !text-green-700 !hover:bg-green-50';
    if (variant === 'both') activeTailwind = 'bg-orange-50 !border-orange-600 !text-orange-700 !hover:bg-orange-50';
  }

  return (
    <button
      onClick={onClick}
      className={`flex-1 py-1.5 text-[11px] font-medium font-mono border border-border-primary rounded-md cursor-pointer transition-all bg-transparent text-text-secondary ${!isActive ? 'hover:bg-secondary' : ''} ${activeTailwind}`}
    >
      {label}
    </button>
  )
}
