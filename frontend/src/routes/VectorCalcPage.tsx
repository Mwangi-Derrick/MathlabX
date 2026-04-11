/**
 * VectorCalcPage — 2D Gradient, Divergence, and Curl analysis.
 */

import React, { useState, useEffect } from 'react'
import { useVectorCalc2D } from '../hooks/useVectorCalc'
import { VectorFieldCanvas2D } from '../components/VectorFieldCanvas2D'
import { Slider } from '../components/Slider'
import { ToggleButton } from '../components/ToggleButton'
import { MetricCard } from '../components/MetricCard'
import { PageProps } from '../App'

export const VectorCalcPage: React.FC<PageProps> = ({ uiMode }) => {
  const [opType, setOpType] = useState<'div' | 'curl' | 'grad'>('div')
  const [preset, setPreset] = useState('source')
  const [ax, setAx] = useState(1.0)
  const [ay, setAy] = useState(1.0)
  const [resX, setResX] = useState(20)
  const [resY, setResY] = useState(20)

  const { loading, grid, compute, streamlines, computeStreamlines, clearStreamlines, theoremResult, verifyTheorem } = useVectorCalc2D(resX, resY)

  useEffect(() => {
    if (!loading) {
      compute(opType, preset, ax, ay)
      if (streamlines.length > 0) {
        computeStreamlines(preset, ax, ay)
      }
    }
  }, [opType, preset, ax, ay, resX, resY, loading, compute])

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  if (loading) return <div className="h-full w-full flex items-center justify-center text-white bg-black">Initializing Vector Calc Engine...</div>

  return (
    <div className="flex flex-col md:flex-row flex-1 relative overflow-hidden bg-black w-full h-full min-h-0">
      {/* Center Canvas Area (Full width) */}
      <div className="flex-1 relative bg-black flex flex-col overflow-hidden z-0 min-h-0">
        <div className="flex-1 relative p-1 lg:p-4 bg-black flex items-center justify-center min-h-0">
          <VectorFieldCanvas2D 
            grid={grid} 
            type={opType} 
            streamlines={streamlines} 
            onSelection={opType === 'curl' ? (bounds) => verifyTheorem(bounds.x0, bounds.y0, bounds.x1, bounds.y1, preset, ax, ay) : undefined}
          />
        </div>
        
        {/* Bottom Status overlay */}
        <div className="absolute bottom-0 left-0 w-full h-12 flex items-center px-4 md:px-6 pointer-events-none z-10 bg-gradient-to-t from-black/90 to-transparent pb-2">
          <div className="ml-auto text-[9px] md:text-[10px] text-text-muted font-mono uppercase tracking-wider">2D Spatial Kernel Active</div>
        </div>
      </div>

      {/* Responsive Inspector Sidebar / Bottom Drawer */}
      <div 
        className={`md:relative md:h-full bg-surface/95 backdrop-blur-2xl border-t md:border-t-0 md:border-l border-border-primary md:shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out shrink-0 z-20 flex flex-col ${
          isSidebarOpen ? 'h-[45vh] md:w-[380px] md:translate-x-0' : 'h-12 md:w-12 md:translate-x-0'
        }`}
      >
        <div className="h-12 border-b border-border-primary flex items-center shrink-0 w-full bg-surface/95 md:bg-transparent backdrop-blur-2xl md:backdrop-blur-none transition-all cursor-pointer md:cursor-auto" onClick={() => { if(window.innerWidth < 768) setIsSidebarOpen(!isSidebarOpen) }}>
          <button 
            className="w-12 h-12 flex items-center justify-center hover:bg-elevated text-text-muted hover:text-text-primary transition-colors shrink-0 outline-none"
            onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(!isSidebarOpen); }}
            title={isSidebarOpen ? "Collapse Properties" : "Expand Properties"}
          >
            <svg viewBox="0 0 24 24" className={`w-5 h-5 fill-current transition-transform duration-300 ${isSidebarOpen ? '-rotate-90 md:rotate-180' : 'rotate-90 md:rotate-0'}`}>
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
            </svg>
          </button>
          
          <div className="overflow-hidden whitespace-nowrap flex-1 px-2 md:px-2 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-text-tertiary">Inspector</span>
            {/* Mobile quick summary when collapsed */}
            {!isSidebarOpen && (
              <span className="md:hidden text-[10px] text-text-muted font-mono px-2">
                {opType.toUpperCase()} • Preset: {preset} • Grid: {resX}x{resY}
              </span>
            )}
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto overflow-x-hidden transition-opacity duration-300 delay-100`}>
          <div className="p-4 md:p-5 flex flex-col gap-4 md:gap-6 pt-16 md:pt-5">
            
            <div className="bg-elevated rounded-xl p-4 md:p-5 border border-border-subtle shadow-sm">
              <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 md:mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_theme(colors.blue.500)]"></span> Operator
              </div>
              <div className="flex flex-col gap-2">
                <ToggleButton label="Divergence (∇·F)" isActive={opType === 'div'} onClick={() => setOpType('div')} />
                <ToggleButton label="Curl (∇×F)" isActive={opType === 'curl'} onClick={() => setOpType('curl')} />
                <ToggleButton label="Gradient (∇V)" isActive={opType === 'grad'} onClick={() => setOpType('grad')} />
              </div>
            </div>

            <div className="bg-elevated rounded-xl p-4 md:p-5 border border-border-subtle shadow-sm">
              <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 md:mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_theme(colors.indigo.500)]"></span> Field Preset
              </div>
              <select value={preset} onChange={(e) => setPreset(e.target.value)} className="w-full p-2.5 text-[11px] md:text-[12px] bg-secondary focus:bg-elevated focus:ring-1 focus:ring-blue-500 text-text-primary border border-border-secondary rounded-lg outline-none transition-all shadow-inner font-medium">
                <option value="source">Radial (Source)</option>
                <option value="rotation">Swirl (Rotation)</option>
                <option value="sink">Sink Field</option>
                <option value="saddle">Saddle Field</option>
                <option value="custom">Custom Params</option>
              </select>
            </div>

            <div className="bg-elevated rounded-xl p-4 md:p-5 border border-border-subtle shadow-sm">
              <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 md:mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_theme(colors.emerald.500)]"></span> Parameters
              </div>
              <div className="flex flex-col gap-2 md:gap-4">
                <Slider label="Scale X" value={ax} min={-2} max={2} step={0.1} onChange={setAx} />
                <Slider label="Scale Y" value={ay} min={-2} max={2} step={0.1} onChange={setAy} />
                <Slider label="Resolution X" value={resX} min={5} max={50} step={1} onChange={setResX} />
                <Slider label="Resolution Y" value={resY} min={5} max={50} step={1} onChange={setResY} />
              </div>
              
              <div className="mt-4 md:mt-6 pt-4 md:pt-5 border-t border-border-secondary flex flex-row items-center justify-between">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">Stream Traces:</span>
                <button 
                  onClick={() => {
                    if (streamlines.length > 0) clearStreamlines()
                    else computeStreamlines(preset, ax, ay)
                  }}
                  className={`px-3 md:px-4 py-2 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all shadow-sm ${streamlines.length > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500 hover:bg-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-blue-600/20 text-blue-400 hover:text-white border border-blue-500 hover:bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]'}`}
                >
                  {streamlines.length > 0 ? 'Clear Traces' : 'Trace Grid'}
                </button>
              </div>
            </div>

            {uiMode === 'basic' && (
              <div className="flex flex-col gap-4 px-2">
                <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Field Status
                </div>
                <MetricCard label="Complexity" value="Calculated" unit="" />
              </div>
            )}

            {uiMode === 'advanced' && (
              <div className="flex flex-col gap-4 md:gap-6">
                <div className="bg-elevated rounded-xl p-4 md:p-5 border border-border-subtle shadow-sm">
                  <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_theme(colors.purple.500)]"></span> Reference
                  </div>
                  <div className="bg-black/50 rounded-lg py-2.5 md:py-3 px-3 font-mono text-[11px] md:text-[12px] text-blue-400 mb-3 md:mb-4 border border-border-secondary shadow-inner">
                    {opType === 'div' && '∇·F = ∂Fx/∂x + ∂Fy/∂y'}
                    {opType === 'curl' && '(∇×F)z = ∂Fy/∂x - ∂Fx/∂y'}
                    {opType === 'grad' && '∇V = (∂V/∂x)i + (∂V/∂y)j'}
                  </div>
                  <p className="text-[10px] md:text-[11px] leading-relaxed text-text-muted">
                    {opType === 'div' && 'Red arrows indicate Source (+div), Green indicate Sink (-div).'}
                    {opType === 'curl' && 'Orange indicates CW rotation, Purple indicates CCW rotation.'}
                    {opType === 'grad' && 'Vectors point in direction of steepest increase.'}
                  </p>
                </div>

                {opType === 'curl' && (
                  <div className="bg-elevated rounded-xl p-4 md:p-5 border border-border-subtle shadow-sm">
                    <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_theme(colors.amber.500)]"></span> Green's Theorem
                    </div>
                    <p className="text-[10px] md:text-[11px] leading-relaxed text-text-muted mb-4">
                      Click and drag a box on the canvas field to evaluate the line integral along its boundary vs the area integral.
                    </p>
                    {theoremResult && (
                      <div className="bg-secondary border border-border-secondary p-3 md:p-4 rounded-lg space-y-2 md:space-y-3 shadow-inner">
                        <div className="text-[10px] md:text-[11px] text-text-secondary flex justify-between tracking-wide items-center">
                          <span className="font-semibold">∮ F·dr:</span> 
                          <span className="font-mono text-[12px] md:text-[13px] text-blue-400 font-bold bg-black/40 px-2 py-1 rounded">{theoremResult.lineIntegral.toFixed(4)}</span>
                        </div>
                        <div className="text-[10px] md:text-[11px] text-text-secondary flex justify-between tracking-wide items-center">
                          <span className="font-semibold">∬ (∇×F)z dA:</span> 
                          <span className="font-mono text-[12px] md:text-[13px] text-purple-400 font-bold bg-black/40 px-2 py-1 rounded">{theoremResult.areaIntegral.toFixed(4)}</span>
                        </div>
                        <div className="text-[10px] md:text-[11px] mt-3 pt-3 border-t border-border-secondary text-right font-bold flex justify-between tracking-wider items-center">
                          <span className="text-text-tertiary uppercase">Result</span>
                          <span className={`${theoremResult.matches ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'} px-2 py-1 rounded-md uppercase text-[10px]`}>
                            {theoremResult.matches ? '✓ Verified' : '✗ Mismatch'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
