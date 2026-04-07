/**
 * App — Root component and application shell.
 */

import React, { useState } from 'react'
import { ACSignalsPage } from './routes/ACSignalsPage'
import { EMFieldPage } from './routes/EMFieldPage'
import { PhasorPage } from './routes/PhasorPage'
import { VectorCalcPage } from './routes/VectorCalcPage'

const modules = [
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
  const CurrentComponent = modules.find((m) => m.id === activeModule)?.component || (() => null)

  return (
    <ErrorBoundary>
      <div className="app-shell">
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

          <div className="status-indicator">
            <div className="status-dot" />
            <span className="status-text">Wasm Kernel Active</span>
          </div>
        </div>

        <CurrentComponent />
      </div>
    </ErrorBoundary>
  )
}

export default App
