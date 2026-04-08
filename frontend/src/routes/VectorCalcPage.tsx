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

  const { grid, compute, loading } = useVectorCalc2D(resX, resY)

  useEffect(() => {
    if (!loading) {
      compute(opType, preset, ax, ay)
    }
  }, [opType, preset, ax, ay, resX, resY, loading, compute])

  if (loading) return <div>Initializing Vector Calc Engine...</div>

  return (
    <div className="main-layout">
      <div className="sidebar">
        <div className="section-group">
          <div className="section-label">Operator</div>
          <div className="wave-toggle" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px' }}>
            <ToggleButton label="Divergence (∇·F)" isActive={opType === 'div'} onClick={() => setOpType('div')} />
            <ToggleButton label="Curl (∇×F)" isActive={opType === 'curl'} onClick={() => setOpType('curl')} />
            <ToggleButton label="Gradient (∇V)" isActive={opType === 'grad'} onClick={() => setOpType('grad')} />
          </div>
        </div>

        <div className="section-group">
          <div className="section-label">Field Preset</div>
          <select value={preset} onChange={(e) => setPreset(e.target.value)} style={{ width: '100%', padding: '8px', background: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
            <option value="source">Radial (Source)</option>
            <option value="rotation">Swirl (Rotation)</option>
            <option value="sink">Sink Field</option>
            <option value="saddle">Saddle Field</option>
            <option value="custom">Custom Params</option>
          </select>
        </div>

        <div className="section-group">
          <div className="section-label">Parameters</div>
          <Slider label="Scale X" value={ax} min={-2} max={2} step={0.1} onChange={setAx} />
          <Slider label="Scale Y" value={ay} min={-2} max={2} step={0.1} onChange={setAy} />
          <Slider label="Resolution X" value={resX} min={5} max={50} step={1} onChange={setResX} />
          <Slider label="Resolution Y" value={resY} min={5} max={50} step={1} onChange={setResY} />
        </div>
      </div>

      <div className="canvas-area">
        <div className="canvas-container">
          <VectorFieldCanvas2D grid={grid} type={opType} />
        </div>
        <div className="status-bar">
          <div className="status-bar-engine">2D Spatial Kernel Active</div>
        </div>
      </div>

      <div className="sidebar-right">
        <div className="basic-only">
          <div className="section-label">Field Status</div>
          <MetricCard label="Complexity" value={uiMode === 'basic' ? "High" : "Calculated"} unit="" />
        </div>

        <div className="advanced-only">
          <div className="section-label">Calculus Reference</div>
          <div className="formula-box" style={{ fontSize: '10px' }}>
            {opType === 'div' && '∇·F = ∂Fx/∂x + ∂Fy/∂y'}
            {opType === 'curl' && '(∇×F)z = ∂Fy/∂x - ∂Fx/∂y'}
            {opType === 'grad' && '∇V = (∂V/∂x)i + (∂V/∂y)j'}
          </div>
          
          <div className="divider" />
          <div className="section-label">Insight</div>
          <p style={{ fontSize: '11px', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
            {opType === 'div' && 'Red arrows indicate Source (+div), Green indicate Sink (-div).'}
            {opType === 'curl' && 'Orange indicates CW rotation, Purple indicates CCW rotation.'}
            {opType === 'grad' && 'Vectors point in direction of steepest increase.'}
          </p>
        </div>
      </div>
    </div>
  )
}
