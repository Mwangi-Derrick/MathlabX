/**
 * EMFieldPage — EM Field visualization in 3D.
 */

import React, { useState, useEffect } from 'react'
import { useSpatialEngine3D } from '../hooks/useSpatialEngine'
import { FieldCanvas3D } from '../components/FieldCanvas3D'
import { Slider } from '../components/Slider'
import { ToggleButton } from '../components/ToggleButton'

export const EMFieldPage: React.FC = () => {
  const [preset, setPreset] = useState('swirl')
  const [showCurl, setShowCurl] = useState(true)
  const [ax, setAx] = useState(1.0)
  const [ay, setAy] = useState(1.0)
  const [az, setAz] = useState(1.0)
  const [fx, setFx] = useState(1.0)
  const [fy, setFy] = useState(1.0)
  const [fz, setFz] = useState(1.0)

  const { grid, compute, loading } = useSpatialEngine3D(8, 8, 8)

  useEffect(() => {
    if (!loading) {
      compute(preset, ax, ay, az, fx, fy, fz)
    }
  }, [preset, ax, ay, az, fx, fy, fz, loading, compute])

  if (loading) return <div>Initializing 3D Spatial Engine...</div>

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
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
            Color indicates Curl Magnitude ($\nabla \times \mathbf { F }\$).
          </p>
        </div>
      </div>

      <div className="canvas-area">
        <div className="canvas-container">
          <FieldCanvas3D grid={grid} showCurl={showCurl} />
        </div>
        <div className="status-bar">
          <div className="status-bar-engine">Three.js + WASM Spatial Kernel</div>
        </div>
      </div>

      <div className="sidebar-right">
        <div className="section-label">Theory: Curl</div>
        <div className="formula-box">
          ∇ × F = (∂Fz/∂y - ∂Fy/∂z)i + ...
        </div>
        <p style={{ fontSize: '11px', lineHeight: '1.4' }}>
          Curl measures the "rotation" of a vector field. In EM, this is critical for Faraday's Law and Ampere's Law.
        </p>
        
        <div className="divider" />
        
        <div className="section-label">C++ Backend</div>
        <div className="code-preview" style={{ fontSize: '10px' }}>
          void computeCurl() {'{'}<br />
          &nbsp;&nbsp;grid[idx].curl_x = dFz_dy - dFy_dz;<br />
          &nbsp;&nbsp;grid[idx].curl_y = dFx_dz - dFz_dx;<br />
          &nbsp;&nbsp;grid[idx].curl_z = dFy_dx - dFx_dy;<br />
          {'}'}
        </div>
      </div>
    </div>
  )
}
