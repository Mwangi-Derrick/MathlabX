import React, { useState, useEffect } from 'react'
import { useSpatialEngine3D } from '../hooks/useSpatialEngine'
import { FieldCanvas3D } from '../components/FieldCanvas3D'
import { Slider } from '../components/Slider'
import { ToggleButton } from '../components/ToggleButton'
import { MetricCard } from '../components/MetricCard'
import { PageProps } from '../App'

export const EMFieldPage: React.FC<PageProps> = ({ uiMode }) => {
  const [preset, setPreset] = useState('swirl')
  const [showCurl, setShowCurl] = useState(true)
  const [ax, setAx] = useState(1.0)
  const [ay, setAy] = useState(1.0)
  const [az, setAz] = useState(1.0)
  const [resX, setResX] = useState(5)
  const [resY, setResY] = useState(5)
  const [resZ, setResZ] = useState(5)

  const { grid, compute, loading } = useSpatialEngine3D(resX, resY, resZ)

  useEffect(() => {
    if (!loading) {
      compute(preset, ax, ay, az, 1.0, 1.0, 1.0)
    }
  }, [preset, ax, ay, az, resX, resY, resZ, loading, compute])

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-secondary to-primary">
        <div className="w-12 h-12 border-[3px] border-border-primary border-t-blue-500 rounded-full animate-[spin_0.8s_linear_infinite] mb-4" />
        <p className="text-text-secondary text-[14px]">Initializing 3D Spatial Kernel...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 relative overflow-hidden bg-black w-full h-full">
      {/* Center Canvas Area (Full width) */}
      <div className="flex-1 relative bg-black flex flex-col overflow-hidden z-0">
        <div className="flex-1 relative p-1 lg:p-4 bg-black flex items-center justify-center min-h-0">
          {grid && grid.length > 0 ? (
            <FieldCanvas3D grid={grid} showCurl={showCurl} />
          ) : (
            <div className="text-text-muted absolute inset-0 flex items-center justify-center">Computing Field Gradients...</div>
          )}
        </div>
        
        {/* Bottom Status overlay */}
        <div className="absolute bottom-0 left-0 w-full h-12 flex items-center px-6 pointer-events-none z-10 bg-gradient-to-t from-black/90 to-transparent pb-2">
          <div className="ml-auto text-[10px] text-text-muted font-mono uppercase tracking-wider">Three.js + WASM Spatial Kernel</div>
        </div>
      </div>

      {/* Right Sidebar - Docked, Collapsible */}
      <div 
        className={`h-full bg-surface/95 backdrop-blur-2xl border-l border-border-primary shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out shrink-0 z-20 flex flex-col ${
          isSidebarOpen ? 'w-[320px] md:w-[380px]' : 'w-12'
        }`}
      >
        <div className="h-12 border-b border-border-primary flex items-center shrink-0">
          <button 
            className="w-12 h-full flex items-center justify-center hover:bg-elevated text-text-muted hover:text-text-primary transition-colors shrink-0 outline-none"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Collapse Properties" : "Expand Properties"}
          >
            <svg viewBox="0 0 24 24" className={`w-5 h-5 fill-current transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`}>
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
            </svg>
          </button>
          
          <div className={`overflow-hidden transition-opacity duration-300 whitespace-nowrap ${isSidebarOpen ? 'opacity-100 flex-1 px-2' : 'opacity-0 w-0'}`}>
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-text-tertiary">Inspector</span>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'} transition-opacity duration-300 delay-100`}>
          <div className="p-5 flex flex-col gap-6">
            
            <div className="bg-elevated rounded-xl p-5 border border-border-subtle shadow-sm">
              <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_theme(colors.blue.500)]"></span> Presets
              </div>
              <div className="flex gap-2">
                <button 
                  className={`flex-1 py-1.5 text-[11px] font-bold tracking-wider rounded-lg transition-colors border ${preset === 'swirl' ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-transparent text-text-secondary border-border-secondary hover:bg-secondary'}`}
                  onClick={() => setPreset('swirl')}
                >Swirl</button>
                <button 
                  className={`flex-1 py-1.5 text-[11px] font-bold tracking-wider rounded-lg transition-colors border ${preset === 'radial' ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-transparent text-text-secondary border-border-secondary hover:bg-secondary'}`}
                  onClick={() => setPreset('radial')}
                >Radial</button>
                <button 
                  className={`flex-1 py-1.5 text-[11px] font-bold tracking-wider rounded-lg transition-colors border ${preset === 'custom' ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-transparent text-text-secondary border-border-secondary hover:bg-secondary'}`}
                  onClick={() => setPreset('custom')}
                >Custom</button>
              </div>
            </div>

            <div className="bg-elevated rounded-xl p-5 border border-border-subtle shadow-sm">
             <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_theme(colors.indigo.500)]"></span> Resolution Grid
              </div>
              <Slider label="Res X" value={resX} min={0} max={50} step={1} onChange={setResX} />
              <Slider label="Res Y" value={resY} min={0} max={50} step={1} onChange={setResY} />
              <Slider label="Res Z" value={resZ} min={0} max={50} step={1} onChange={setResZ} />
            </div>

            <div className="bg-elevated rounded-xl p-5 border border-border-subtle shadow-sm">
              <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_theme(colors.emerald.500)]"></span> Field Amplitudes
              </div>
              <Slider label="Amp X" value={ax} min={0} max={5} step={0.1} onChange={setAx} />
              <Slider label="Amp Y" value={ay} min={0} max={5} step={0.1} onChange={setAy} />
              <Slider label="Amp Z" value={az} min={0} max={5} step={0.1} onChange={setAz} />
            </div>

            <div className="bg-elevated rounded-xl p-5 border border-border-subtle shadow-sm">
              <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_theme(colors.purple.500)]"></span> Visualization
              </div>
              <button 
                className={`w-full py-2.5 px-3 text-[11px] font-bold tracking-wide rounded-md transition-colors border ${showCurl ? 'bg-purple-600/20 text-purple-400 border-purple-500/50' : 'bg-secondary text-text-secondary hover:text-text-primary border-border-secondary'}`}
                onClick={() => setShowCurl(!showCurl)}
              >
                {showCurl ? 'Hide Curl Vector' : 'Show Curl Vector'}
              </button>
            </div>

            {uiMode === 'basic' && (
              <div className="flex flex-col gap-4 px-2">
                <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Summary
                </div>
                <MetricCard label="Visual Mode" value="Interactive 3D" unit="" />
                <p className="text-[11px] text-text-tertiary">Real-time vector field visualization using C++ compute.</p>
              </div>
            )}

            {uiMode === 'advanced' && (
              <div className="bg-elevated rounded-xl p-5 border border-border-subtle shadow-sm">
                <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_theme(colors.cyan.500)]"></span> Theory: Curl
                </div>
                <div className="bg-black/50 rounded-lg border border-border-secondary py-3 px-3 font-mono text-[11px] text-blue-400 mb-3 shadow-inner">
                  ∇ × F = (∂Fz/∂y - ∂Fy/∂z)i + ...
                </div>
                <p className="text-[11px] leading-relaxed text-text-muted">
                  Adjust parameters to see how curl relates to field rotation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
