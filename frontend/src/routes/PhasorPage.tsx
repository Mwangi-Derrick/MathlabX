/**
 * PhasorPage — Vector representation of RLC circuit voltages.
 */

import React, { useState, useEffect, useRef } from 'react'
import { usePhasorEngine } from '../hooks/usePhasorEngine'
import { PhasorCanvas } from '../components/PhasorCanvas'
import { Slider } from '../components/Slider'
import { MetricCard } from '../components/MetricCard'
import { PageProps } from '../App'

export const PhasorPage: React.FC<PageProps> = ({ uiMode }) => {
  const [resistance, setResistance] = useState(50)
  const [inductance, setInductance] = useState(0.05)
  const [capacitance, setCapacitance] = useState(0.0001)
  const [amplitude, setAmplitude] = useState(100)
  const [frequency, setFrequency] = useState(50)
  const [time, setTime] = useState(0)
  const [isAnimated, setIsAnimated] = useState(false)
  const isAnimatedRef = useRef(isAnimated)
  
  useEffect(() => { isAnimatedRef.current = isAnimated }, [isAnimated])

  const { phasors, computePhasors, loading } = usePhasorEngine(0, 0.05, 800)

  // Animation Loop
  useEffect(() => {
    let frame: number
    const tick = (t: number) => {
      if (isAnimatedRef.current) {
        setTime(t / 1000) // Convert ms to s
      } else {
        setTime(0) // Stationary reference frame
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!loading) {
      computePhasors(resistance, inductance, capacitance, amplitude, frequency)
    }
  }, [resistance, inductance, capacitance, amplitude, frequency, loading, computePhasors])

  if (loading) return <div className="loading-screen">Initializing Phasor Engine...</div>

  // Determine maxVal for scaling from the phasors
  let maxV = 100
  if (phasors) {
    maxV = Math.max(
      amplitude,
      Math.sqrt(phasors.vr.real ** 2 + phasors.vr.imag ** 2),
      Math.sqrt(phasors.vl.real ** 2 + phasors.vl.imag ** 2),
      Math.sqrt(phasors.vc.real ** 2 + phasors.vc.imag ** 2)
    )
  }

  return (
    <div className="grid grid-cols-[220px_1fr_200px] flex-1 overflow-hidden">
      <div className="bg-primary border-r border-border-primary py-4 px-3 overflow-y-auto">
        <div className="mb-5">
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Source</div>
          <Slider label="Amplitude" value={amplitude} min={10} max={200} step={1} onChange={setAmplitude} />
          <Slider label="Frequency" value={frequency} min={1} max={100} step={1} onChange={setFrequency} />
        </div>

        <div className="mb-5">
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Load (RLC)</div>
          <Slider label="R (Ω)" value={resistance} min={1} max={200} step={1} onChange={setResistance} />
          <Slider label="L (H)" value={inductance} min={0.01} max={1} step={0.01} onChange={setInductance} />
          <Slider label="C (µF)" value={capacitance * 1000000} min={1} max={500} step={1} onChange={(v) => setCapacitance(v / 1000000)} />
        </div>
      </div>

      <div className="bg-black flex flex-col overflow-hidden">
        <div className="flex-1 relative p-4 bg-black flex items-center justify-center">
          {phasors && (
            <PhasorCanvas 
              vs={phasors.vs} 
              vr={phasors.vr} 
              vl={phasors.vl} 
              vc={phasors.vc} 
              maxVal={maxV} 
              time={time}
              freq={frequency}
            />
          )}
        </div>
        <div className="h-9 border-t border-border-primary flex items-center gap-4 px-4 bg-primary shrink-0">
          <div className="ml-auto text-[10px] text-text-muted font-mono">C++ Phasor Kernel · {uiMode.toUpperCase()} Active</div>
        </div>
      </div>

      <div className="bg-primary border-l border-border-primary py-3.5 px-3 overflow-y-auto flex flex-col gap-3">
        {uiMode === 'basic' && (
          <div>
            <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Summary</div>
            <MetricCard 
              label="Load Type" 
              value={Math.abs(phasors?.phi || 0) < 0.1 ? "Resistive" : (phasors?.phi || 0) > 0 ? "Inductive" : "Capacitive"} 
              unit="" 
            />
          </div>
        )}

        {uiMode === 'advanced' && (
          <div>
            <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Vector Analysis</div>
            <div className="mb-3">
              <button 
                className={`w-full flex justify-center items-center py-2 px-3 text-[11px] font-bold tracking-wide uppercase transition-colors rounded ${isAnimated ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'bg-[#1e293b] text-text-secondary hover:text-white border border-transparent'}`}
                onClick={() => setIsAnimated(!isAnimated)}
              >
                {isAnimated ? '⏸️ Stop Rotation' : '▶️ Animate Rotation'}
              </button>
            </div>
            {phasors && (
              <>
                <MetricCard label="Phase Angle φ" value={(phasors.phi * 180 / Math.PI).toFixed(1)} unit="°" />
                <MetricCard label="Z (Impedance)" value={phasors.z.toFixed(1)} unit="Ω" />
                
                <div className="h-px bg-border-primary my-3" />
                <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Polar Forms</div>
                <div className="bg-blue-600/5 border-l-2 border-blue-600 rounded-r-sm py-1.5 px-2 font-mono text-[10px] text-blue-400 mb-1.5">
                  VR: {(Math.sqrt(phasors.vr.real**2 + phasors.vr.imag**2)).toFixed(1)}V ∠ {(Math.atan2(phasors.vr.imag, phasors.vr.real) * 180/Math.PI).toFixed(0)}°
                </div>
                <div className="bg-blue-600/5 border-l-2 border-blue-600 rounded-r-sm py-1.5 px-2 font-mono text-[10px] text-yellow-500 mb-1.5">
                  VL: {(Math.sqrt(phasors.vl.real**2 + phasors.vl.imag**2)).toFixed(1)}V ∠ {(Math.atan2(phasors.vl.imag, phasors.vl.real) * 180/Math.PI).toFixed(0)}°
                </div>
                <div className="bg-blue-600/5 border-l-2 border-emerald-500 rounded-r-sm py-1.5 px-2 font-mono text-[10px] text-emerald-500">
                  VC: {(Math.sqrt(phasors.vc.real**2 + phasors.vc.imag**2)).toFixed(1)}V ∠ {(Math.atan2(phasors.vc.imag, phasors.vc.real) * 180/Math.PI).toFixed(0)}°
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
