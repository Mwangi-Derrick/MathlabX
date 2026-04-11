/**
 * App — Root component and application shell.
 */

import React, { useState } from 'react'
import { ACSignalsPage } from './routes/ACSignalsPage'
import { EMFieldPage } from './routes/EMFieldPage'
import { PhasorPage } from './routes/PhasorPage'
import { VectorCalcPage } from './routes/VectorCalcPage'

export interface PageProps {
  uiMode: 'basic' | 'advanced'
}

const modules: { id: string; label: string; component: React.FC<PageProps> }[] = [
  { id: 'ac', label: 'AC Signals', component: ACSignalsPage },
  { id: 'phasor', label: 'Phasor', component: PhasorPage },
  { id: 'field', label: 'EM Field', component: EMFieldPage },
  { id: 'vec', label: 'Vector Calc', component: VectorCalcPage },
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
      <div className={`h-screen flex flex-col bg-tertiary ui-${uiMode}`}>
        <div className="bg-primary border-b border-border-primary px-5 h-12 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-800 rounded-md flex items-center justify-center shadow-glow-blue">
              <svg viewBox="0 0 14 14" fill="none" className="w-[14px] h-[14px]">
                <path d="M2 7 Q4 2 7 7 Q10 12 12 7" stroke="white" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-text-primary tracking-[0.01em]">MathlabX</div>
              <div className="text-[11px] text-text-tertiary">Computational EEE Toolkit - C++ & WASM</div>
            </div>
          </div>

          <div className="flex gap-1">
            {modules.map((mod) => {
              const isActive = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModule(mod.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium font-sans cursor-pointer transition-all duration-150 border ${
                    isActive 
                      ? 'bg-blue-800 text-white border-blue-700 shadow-glow-blue' 
                      : 'bg-transparent text-text-secondary border-border-primary hover:bg-secondary'
                  }`}
                >
                  {mod.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-[15px]">
            <button 
              className="px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer border border-border-primary bg-secondary text-text-secondary hover:bg-elevated hover:border-blue-500 hover:text-[#4f4a4a] transition-all flex items-center gap-1.5"
              onClick={() => setThemeMode(m => m === 'dark' ? 'light' : 'dark')}
            >
              {themeMode === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button 
              className={`px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer border transition-all flex items-center gap-1.5 ${
                uiMode === 'advanced' 
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400 hover:bg-elevated hover:border-blue-500 hover:text-[#4f4a4a]'
                  : 'bg-secondary border-border-primary text-text-secondary hover:bg-elevated hover:border-blue-500 hover:text-[#4f4a4a]'
              }`}
              onClick={() => setUiMode(m => m === 'basic' ? 'advanced' : 'basic')}
            >
              {uiMode === 'basic' ? '✨ Simple Mode' : '🛠️ Advanced Mode'}
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-[7px] h-[7px] rounded-full bg-emerald-500 animate-[pulse_1.5s_infinite]" />
              <span className="text-[11px] text-text-tertiary">Wasm Kernel Active</span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <CurrentComponent uiMode={uiMode} />
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
