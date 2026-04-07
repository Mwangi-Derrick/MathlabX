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
  const [uiMode, setUiMode] = useState<'basic' | 'advanced'>('basic')
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark')
  
  const CurrentComponent = modules.find((m) => m.id === activeModule)?.component || (() => null)

  // Sync theme with body attribute so CSS works globally
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode)
  }, [themeMode])

  return (
    <ErrorBoundary>
      <div className={`app-shell ui-${uiMode}`}>
        <div className="topbar">
          <div className="logo">
            <div className="logo-mark">
              <svg viewBox="0 0 14 14" fill="none">
                <path d="M2 7 Q4 2 7 7 Q10 12 12 7" stroke="white" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
            <div>
              <div className="logo-title">MathlabX</div>
              <div className="logo-subtitle">Computational EEE Toolkit - C++ & WASM</div>
            </div>
          </div>

          <div className="module-tabs">
            {modules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`module-tab ${activeModule === mod.id ? 'active' : ''}`}
              >
                {mod.label}
              </button>
            ))}
          </div>

          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              className="ui-toggle"
              onClick={() => setThemeMode(m => m === 'dark' ? 'light' : 'dark')}
              style={{ padding: '4px 10px' }}
            >
              {themeMode === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button 
              className={`ui-toggle ${uiMode}`}
              onClick={() => setUiMode(m => m === 'basic' ? 'advanced' : 'basic')}
            >
              {uiMode === 'basic' ? '✨ Simple Mode' : '🛠️ Advanced Mode'}
            </button>
            
            <div className="status-indicator">
              <div className="status-dot" />
              <span className="status-text">Wasm Kernel Active</span>
            </div>
          </div>
        </div>

        <div className="main-content" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <CurrentComponent uiMode={uiMode} />
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
