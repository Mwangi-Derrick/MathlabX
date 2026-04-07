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

  const { grid, compute, loading } = useSpatialEngine3D(8, 8, 8)

  useEffect(() => {
    if (!loading) {
      compute(preset, ax, ay, az, 1.0, 1.0, 1.0)
    }
  }, [preset, ax, ay, az, loading, compute])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <p>Initializing 3D Spatial Kernel...</p>
      </div>
    )
  }

  return (
    <div className="main-layout">
      <div className="sidebar">
        <div className="section-group">
          <div className="section-label">Presets</div>
          <div className="wave-toggle">
            <ToggleButton label="Swirl" isActive={preset === 'swirl'} onClick={() => setPreset('swirl')} />
            <ToggleButton label="Radial" isActive={preset === 'radial'} onClick={() => setPreset('radial')} />
            <ToggleButton label="Custom" isActive={preset === 'custom'} onClick={() => setPreset('custom')} />
          </div>
        </div>

        <div className="section-group">
          <div className="section-label">Field Parameters</div>
          <Slider label="Amp X" value={ax} min={0} max={5} step={0.1} onChange={setAx} />
          <Slider label="Amp Y" value={ay} min={0} max={5} step={0.1} onChange={setAy} />
          <Slider label="Amp Z" value={az} min={0} max={5} step={0.1} onChange={setAz} />
        </div>

        <div className="section-group">
          <div className="section-label">Visualization</div>
          <div className="wave-toggle">
            <ToggleButton label="Show Curl" isActive={showCurl} onClick={() => setShowCurl(!showCurl)} />
          </div>
        </div>
      </div>

      <div className="canvas-area">
        <div className="canvas-container">
          {grid && grid.length > 0 ? (
            <FieldCanvas3D grid={grid} showCurl={showCurl} />
          ) : (
            <div className="status-message">Computing Field Gradients...</div>
          )}
        </div>
        <div className="status-bar">
          <div className="status-bar-engine">Three.js + WASM Spatial Kernel</div>
        </div>
      </div>

      <div className="sidebar-right">
        <div className={uiMode === 'basic' ? 'ui-visible' : 'ui-hidden'}>
          <div className="section-label">Summary</div>
          <MetricCard label="Visual Mode" value="Interactive 3D" />
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
            Real-time vector field visualization using C++ compute.
          </p>
        </div>

        <div className={uiMode === 'advanced' ? 'ui-visible' : 'ui-hidden'}>
          <div className="section-label">Theory: Curl</div>
          <div className="formula-box">
            ∇ × F = (∂Fz/∂y - ∂Fy/∂z)i + ...
          </div>
          <p style={{ fontSize: '11px', lineHeight: '1.4' }}>
            Adjust parameters to see how curl relates to field rotation.
          </p>
        </div>
      </div>
    </div>
  )
}
