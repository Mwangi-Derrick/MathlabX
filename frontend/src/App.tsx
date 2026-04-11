/**
 * App — Root component and application shell.
 */

import React, { useState } from 'react'
import { ACSignalsPage } from './routes/ACSignalsPage'
import { EMFieldPage } from './routes/EMFieldPage'
import { PhasorPage } from './routes/PhasorPage'
import { VectorCalcPage } from './routes/VectorCalcPage'
import './index.css'

export interface PageProps {
  uiMode: 'basic' | 'advanced'
}

const modules: { id: string; label: string; short: string; icon: string; component: React.FC<PageProps> }[] = [
  { id: 'ac', label: 'AC Signals', short: 'AC', icon: '∿', component: ACSignalsPage },
  { id: 'phasor', label: 'Phasor', short: 'Phs', icon: '∠', component: PhasorPage },
  { id: 'field', label: 'EM Field', short: 'EM', icon: '∇', component: EMFieldPage },
  { id: 'vec', label: 'Vector Calc', short: 'Vec', icon: '→', component: VectorCalcPage },
]

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-screen">
          <div className="error-card">
            <p className="error-title">❌ Rendering Error</p>
            <p className="error-message">{this.state.error?.message}</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState('ac')
  const [uiMode, setUiMode] = useState<'basic' | 'advanced'>('advanced')
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('light')
  
  const CurrentComponent = modules.find((m) => m.id === activeModule)?.component || (() => null)

  // Sync theme with body attribute so CSS works globally
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode)
  }, [themeMode])

  return (
    <ErrorBoundary>
      <div className={`h-screen flex flex-row bg-black ui-${uiMode} overflow-hidden`}>
        {/* Left Vertical Navigation Toolbar */}
        <div className="w-16 md:w-20 bg-surface border-r border-border-primary flex flex-col items-center py-5 shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-50 shrink-0">
          
          {/* Logo */}
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] mb-8 cursor-pointer group" title="MathlabX">
            <svg viewBox="0 0 14 14" fill="none" className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform">
              <path d="M2 7 Q4 2 7 7 Q10 12 12 7" stroke="white" strokeWidth="1.5" fill="none" />
            </svg>
          </div>

          {/* Module Links */}
          <div className="flex flex-col gap-4 w-full px-2 md:px-3 flex-1 overflow-y-auto scrollbar-hide">
            {modules.map((mod) => {
              const isActive = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModule(mod.id)}
                  title={mod.label}
                  className={`relative flex flex-col items-center justify-center w-full aspect-square rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-elevated border border-blue-500/50 shadow-[0_4px_12px_rgba(0,0,0,0.1)]' 
                      : 'hover:bg-elevated/50 text-text-muted border border-transparent'
                  }`}
                >
                  <span className={`text-[16px] md:text-[20px] font-mono leading-none mb-1 ${isActive ? 'text-blue-500 font-bold' : 'group-hover:text-text-secondary'}`}>
                    {mod.icon}
                  </span>
                  <span className={`text-[9px] md:text-[10px] font-bold tracking-wider ${isActive ? 'text-text-primary' : 'group-hover:text-text-secondary'}`}>
                    {mod.short}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Global Actions (Bottom) */}
          <div className="flex flex-col items-center gap-4 mt-auto pt-4 border-t border-border-primary w-full px-2">
            
            {/* Wasm Indicator */}
            <div className="flex flex-col items-center gap-1.5" title="WASM Engine Active">
              <div className="w-[8px] h-[8px] rounded-full bg-emerald-500 animate-[pulse_1.5s_infinite] shadow-[0_0_8px_theme(colors.emerald.500)]" />
              <div className="text-[8px] font-bold text-emerald-500 tracking-widest uppercase">Wasm</div>
            </div>

            {/* Theme Toggle */}
            <button 
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-elevated border border-border-primary text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors mt-2"
              onClick={() => setThemeMode(m => m === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <span className="text-[16px]">{themeMode === 'dark' ? '☀️' : '🌙'}</span>
            </button>

            {/* Mode Toggle */}
            <button 
              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex flex-col items-center justify-center border transition-colors ${
                uiMode === 'advanced' 
                  ? 'bg-blue-600/10 border-blue-500/40 text-blue-400'
                  : 'bg-elevated border-border-primary text-text-secondary'
              }`}
              onClick={() => setUiMode(m => m === 'basic' ? 'advanced' : 'basic')}
              title={`Toggle Mode (Current: ${uiMode})`}
            >
              <span className="text-[14px] leading-none mb-0.5">{uiMode === 'basic' ? '✨' : '🛠️'}</span>
              <span className="text-[8px] font-bold tracking-widest uppercase">{uiMode === 'basic' ? 'Simp' : 'Adv'}</span>
            </button>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex flex-1 relative bg-black overflow-hidden flex-col">
          {/* Subtle Global Header */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex items-center justify-center">
            <h1 className="text-text-muted font-bold tracking-[0.2em] shadow-lg shadow-black/50 uppercase text-[10px] md:text-[12px] bg-surface/40 md:bg-surface/20 px-4 py-1.5 rounded-full border border-border-secondary backdrop-blur-xl">
              MathlabX <span className="text-blue-500/80 mx-2">/</span> <span className="text-white/80">{modules.find(m => m.id === activeModule)?.label}</span>
            </h1>
          </div>
          <CurrentComponent uiMode={uiMode} />
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
