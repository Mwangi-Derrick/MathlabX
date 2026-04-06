/**
 * App — Root component and application shell.
 * 
 * Renders the top bar with module tabs and the currently active module.
 * Uses an ErrorBoundary to catch and display React rendering errors
 * (especially useful for debugging WASM integration issues).
 */

import React, { useState } from 'react'
import { ACSignalsPage } from './routes/ACSignalsPage'

/**
 * Module registry — each entry maps to a tab in the top bar.
 * Only AC Signals is implemented; others are placeholders for future work.
 */
const modules = [
  { id: 'ac', label: 'AC Signals', component: ACSignalsPage },
  { id: 'phasor', label: 'Phasor', component: () => <div className="placeholder-module">Phasor Module — Coming Soon</div> },
  { id: 'field', label: 'EM Field', component: () => <div className="placeholder-module">EM Field Module — Coming Soon</div> },
  { id: 'vec', label: 'Vector Calc', component: () => <div className="placeholder-module">Vector Calc Module — Coming Soon</div> },
]

/** Error boundary state */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary — catches React rendering errors and shows a debug screen.
 * Without this, a WASM error during rendering would produce a white screen.
 */
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
            <details className="error-details">
              <summary>Stack Trace</summary>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '10px', marginTop: '8px' }}>
                {this.state.error?.stack}
              </pre>
            </details>
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
        {/* Top Bar */}
        <div className="topbar">
          {/* Logo */}
          <div className="logo">
            <div className="logo-mark">
              <svg viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7 Q4 2 7 7 Q10 12 12 7"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <div className="logo-title">Computational Engineering Toolkit</div>
              <div className="logo-subtitle">JKUAT EEE 2.2 — C++ / Wasm</div>
            </div>
          </div>

          {/* Module Tabs */}
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

          {/* Status */}
          <div className="status-indicator">
            <div className="status-dot" />
            <span className="status-text">60 fps · Wasm engine</span>
          </div>
        </div>

        {/* Active Module */}
        <CurrentComponent />
      </div>
    </ErrorBoundary>
  )
}

export default App
