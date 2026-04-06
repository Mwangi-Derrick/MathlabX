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
  // Map variant to CSS class when active
  const activeClass = isActive ? `active-${variant}` : ''

  return (
    <button
      onClick={onClick}
      className={`wave-btn ${activeClass}`}
    >
      {label}
    </button>
  )
}
