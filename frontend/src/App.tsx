import React, { useState } from 'react'
import { ACSignalsPage } from './routes/ACSignalsPage'

const modules = [
  { id: 'ac', label: 'AC Signals', component: ACSignalsPage },
  { id: 'phasor', label: 'Phasor', component: () => <div className="p-4">Phasor Module (Coming Soon)</div> },
  { id: 'field', label: 'EM Field', component: () => <div className="p-4">EM Field Module (Coming Soon)</div> },
  { id: 'vec', label: 'Vector Calc', component: () => <div className="p-4">Vector Calc Module (Coming Soon)</div> },
]

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState('ac')

  const CurrentComponent = modules.find((m) => m.id === activeModule)?.component || (() => null)

  return (
    <div className="h-screen bg-cet-slate-800 flex flex-col">
      {/* Topbar */}
      <div className="bg-cet-slate-900 border-b border-cet-slate-700 px-5 h-12 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-cet-blue-800 rounded flex items-center justify-center">
            <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
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
            <div className="text-xs font-semibold text-cet-slate-100">Computational Engineering Toolkit</div>
            <div className="text-xs text-cet-slate-500">JKUAT EEE 2.2 — C++ / Wasm</div>
          </div>
        </div>

        {/* Module Tabs */}
        <div className="flex gap-1">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className={`px-3 py-1 text-xs font-medium rounded border transition-all ${
                activeModule === module.id
                  ? 'bg-cet-blue-800 text-white border-cet-blue-700'
                  : 'bg-transparent text-cet-slate-400 border-cet-slate-700 hover:bg-cet-slate-800'
              }`}
            >
              {module.label}
            </button>
          ))}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-cet-slate-500">60 fps · Wasm engine</span>
        </div>
      </div>

      {/* Content */}
      <CurrentComponent />
    </div>
  )
}

export default App
