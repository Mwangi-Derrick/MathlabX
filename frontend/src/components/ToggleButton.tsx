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
  const baseClass =
    'flex-1 py-1 px-2 text-xs font-medium border border-cet-slate-600 rounded transition-all'

  let activeClass = ''
  if (isActive) {
    if (variant === 'sin') {
      activeClass = 'bg-cet-blue-50 border-cet-blue-600 text-cet-blue-800'
    } else if (variant === 'cos') {
      activeClass = 'bg-cet-green-50 border-cet-green-600 text-cet-green-700'
    } else {
      activeClass = 'bg-cet-orange-50 border-cet-orange-600 text-cet-orange-700'
    }
  } else {
    activeClass = 'bg-transparent text-cet-slate-400 hover:bg-cet-slate-700'
  }

  return (
    <button onClick={onClick} className={`${baseClass} ${activeClass}`}>
      {label}
    </button>
  )
}
