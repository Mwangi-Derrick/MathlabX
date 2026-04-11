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

  if (loading) return <div>Initializing Vector Calc Engine...</div>

  return (
    <div className="grid grid-cols-[220px_1fr_200px] flex-1 overflow-hidden">
      <div className="bg-primary border-r border-border-primary py-4 px-3 overflow-y-auto">
        <div className="mb-5">
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Operator</div>
          <div className="grid grid-cols-1 gap-[5px] mb-3">
            <ToggleButton label="Divergence (∇·F)" isActive={opType === 'div'} onClick={() => setOpType('div')} />
            <ToggleButton label="Curl (∇×F)" isActive={opType === 'curl'} onClick={() => setOpType('curl')} />
            <ToggleButton label="Gradient (∇V)" isActive={opType === 'grad'} onClick={() => setOpType('grad')} />
          </div>
        </div>

        <div className="mb-5">
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Field Preset</div>
          <select value={preset} onChange={(e) => setPreset(e.target.value)} className="w-full p-2 bg-[#1e293b] text-white border border-white/10 rounded">
            <option value="source">Radial (Source)</option>
            <option value="rotation">Swirl (Rotation)</option>
            <option value="sink">Sink Field</option>
            <option value="saddle">Saddle Field</option>
            <option value="custom">Custom Params</option>
          </select>
        </div>

        <div className="mb-5">
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Parameters</div>
          <Slider label="Scale X" value={ax} min={-2} max={2} step={0.1} onChange={setAx} />
          <Slider label="Scale Y" value={ay} min={-2} max={2} step={0.1} onChange={setAy} />
          <Slider label="Resolution X" value={resX} min={5} max={50} step={1} onChange={setResX} />
          <Slider label="Resolution Y" value={resY} min={5} max={50} step={1} onChange={setResY} />
          
          <div className="mt-4 flex flex-row items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-text-secondary">Streamlines Tracer:</span>
            <button 
              onClick={() => {
                if (streamlines.length > 0) clearStreamlines()
                else computeStreamlines(preset, ax, ay)
              }}
              className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded transition-colors ${streamlines.length > 0 ? 'bg-blue-600 text-white border border-blue-500' : 'bg-[#1e293b] text-text-tertiary hover:text-white border border-transparent hover:border-white/20'}`}
            >
              {streamlines.length > 0 ? 'Clear Traces' : 'Trace Grid'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-black flex flex-col overflow-hidden">
        <div className="flex-1 relative p-4 min-h-0 bg-black">
          <VectorFieldCanvas2D 
            grid={grid} 
            type={opType} 
            streamlines={streamlines} 
            onSelection={opType === 'curl' ? (bounds) => verifyTheorem(bounds.x0, bounds.y0, bounds.x1, bounds.y1, preset, ax, ay) : undefined}
          />
        </div>
        <div className="h-9 border-t border-border-primary flex items-center gap-4 px-4 bg-primary shrink-0">
          <div className="ml-auto text-[10px] text-text-muted font-mono">2D Spatial Kernel Active</div>
        </div>
      </div>

      <div className="bg-primary border-l border-border-primary py-3.5 px-3 overflow-y-auto flex flex-col gap-3">
        {uiMode === 'basic' && (
          <div>
            <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Field Status</div>
            <MetricCard label="Complexity" value="Calculated" unit="" />
          </div>
        )}

        {uiMode === 'advanced' && (
          <div>
            <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Calculus Reference</div>
            <div className="bg-blue-600/5 border-l-2 border-blue-600 rounded-r-sm py-1.5 px-2.5 font-mono text-[11px] text-blue-400 mb-1.5">
              {opType === 'div' && '∇·F = ∂Fx/∂x + ∂Fy/∂y'}
              {opType === 'curl' && '(∇×F)z = ∂Fy/∂x - ∂Fx/∂y'}
              {opType === 'grad' && '∇V = (∂V/∂x)i + (∂V/∂y)j'}
            </div>
            
            <div className="h-px bg-border-primary my-3" />
            <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Insight</div>
            <p className="text-[11px] leading-[1.4] text-text-secondary">
              {opType === 'div' && 'Red arrows indicate Source (+div), Green indicate Sink (-div).'}
              {opType === 'curl' && 'Orange indicates CW rotation, Purple indicates CCW rotation.'}
              {opType === 'grad' && 'Vectors point in direction of steepest increase.'}
            </p>

            {opType === 'curl' && (
              <>
                <div className="h-px bg-border-primary my-3" />
                <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Green's Theorem Test</div>
                <p className="text-[11px] leading-[1.4] text-text-secondary px-1 mb-2">
                  Click and drag a box on the canvas field to evaluate the line integral along its boundary vs the area integral.
                </p>
                {theoremResult && (
                  <div className="bg-[#020617] border border-white/5 p-3 rounded-md space-y-1.5 shadow-inner">
                    <div className="text-[11px] text-text-secondary flex justify-between tracking-wide">
                      <span>∮ F·dr:</span> 
                      <span className="font-mono text-blue-400">{theoremResult.lineIntegral.toFixed(4)}</span>
                    </div>
                    <div className="text-[11px] text-text-secondary flex justify-between tracking-wide">
                      <span>∬ (∇×F)z dA:</span> 
                      <span className="font-mono text-purple-400">{theoremResult.areaIntegral.toFixed(4)}</span>
                    </div>
                    <div className="text-[10px] mt-2 pt-1.5 border-t border-white/5 text-right font-medium flex justify-between">
                      <span className="text-text-tertiary">Equality</span>
                      <span className={theoremResult.matches ? 'text-emerald-500' : 'text-red-500'}>
                        {theoremResult.matches ? '✓ VERIFIED' : '✗ MISMATCH'}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
