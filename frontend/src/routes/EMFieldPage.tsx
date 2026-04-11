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

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-secondary to-primary">
        <div className="w-12 h-12 border-[3px] border-border-primary border-t-blue-500 rounded-full animate-[spin_0.8s_linear_infinite] mb-4" />
        <p className="text-text-secondary text-[14px]">Initializing 3D Spatial Kernel...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[220px_1fr_200px] flex-1 overflow-hidden">
      <div className="bg-primary border-r border-border-primary py-4 px-3 overflow-y-auto">
        <div className="mb-5">
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Presets</div>
          <div className="flex gap-1 mb-3">
            <ToggleButton label="Swirl" isActive={preset === 'swirl'} onClick={() => setPreset('swirl')} />
            <ToggleButton label="Radial" isActive={preset === 'radial'} onClick={() => setPreset('radial')} />
            <ToggleButton label="Custom" isActive={preset === 'custom'} onClick={() => setPreset('custom')} />
          </div>
        </div>

        <div className="mb-5">
         <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Resolution</div>
         <div>
          <Slider label="Res X" value={resX} min={0} max={50} step={1} onChange={setResX} />
          <Slider label="Res Y" value={resY} min={0} max={50} step={1} onChange={setResY} />
          <Slider label="Res Z" value={resZ} min={0} max={50} step={1} onChange={setResZ} />
         </div>
        </div>

        <div className="mb-5">
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Field Parameters</div>
          <Slider label="Amp X" value={ax} min={0} max={5} step={0.1} onChange={setAx} />
          <Slider label="Amp Y" value={ay} min={0} max={5} step={0.1} onChange={setAy} />
          <Slider label="Amp Z" value={az} min={0} max={5} step={0.1} onChange={setAz} />
        </div>

        <div className="mb-5">
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Visualization</div>
          <div className="flex gap-1 mb-3">
            <ToggleButton label="Show Curl" isActive={showCurl} onClick={() => setShowCurl(!showCurl)} />
          </div>
        </div>
      </div>

      <div className="bg-black flex flex-col overflow-hidden">
        <div className="flex-1 relative p-4 min-h-0 bg-black">
          {grid && grid.length > 0 ? (
            <FieldCanvas3D grid={grid} showCurl={showCurl} />
          ) : (
            <div className="text-text-muted absolute inset-0 flex items-center justify-center">Computing Field Gradients...</div>
          )}
        </div>
        <div className="h-9 border-t border-border-primary flex items-center gap-4 px-4 bg-primary shrink-0">
          <div className="ml-auto text-[10px] text-text-muted font-mono">Three.js + WASM Spatial Kernel</div>
        </div>
      </div>

      <div className="bg-primary border-l border-border-primary py-3.5 px-3 overflow-y-auto flex flex-col gap-3">
        {uiMode === 'basic' && (
          <div>
            <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Summary</div>
            <MetricCard label="Visual Mode" value="Interactive 3D" unit="" />
            <p className="text-[11px] text-text-tertiary mt-2">
              Real-time vector field visualization using C++ compute.
            </p>
          </div>
        )}

        {uiMode === 'advanced' && (
          <div>
            <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Theory: Curl</div>
            <div className="bg-blue-600/5 border-l-2 border-blue-600 rounded-r-sm py-1.5 px-2.5 font-mono text-[11px] text-blue-400 mb-1.5">
              ∇ × F = (∂Fz/∂y - ∂Fy/∂z)i + ...
            </div>
            <p className="text-[11px] leading-[1.4] text-text-secondary">
              Adjust parameters to see how curl relates to field rotation.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
