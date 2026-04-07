/**
 * PhasorPage — Vector representation of RLC circuit voltages.
 */

import React, { useState, useEffect } from 'react'
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

  const { phasors, computePhasors, loading } = usePhasorEngine(0, 0.05, 800)

  // Animation Loop
  useEffect(() => {
    let frame: number
    const tick = (t: number) => {
      setTime(t / 1000) // Convert ms to s
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
    <div className="main-layout">
      <div className="sidebar">
        <div className="section-group">
          <div className="section-label">Source</div>
          <Slider label="Amplitude" value={amplitude} min={10} max={200} step={1} onChange={setAmplitude} />
          <Slider label="Frequency" value={frequency} min={1} max={100} step={1} onChange={setFrequency} />
        </div>

        <div className="section-group">
          <div className="section-label">Load (RLC)</div>
          <Slider label="R (Ω)" value={resistance} min={1} max={200} step={1} onChange={setResistance} />
          <Slider label="L (H)" value={inductance} min={0.01} max={1} step={0.01} onChange={setInductance} />
          <Slider label="C (µF)" value={capacitance * 1000000} min={1} max={500} step={1} onChange={(v) => setCapacitance(v / 1000000)} />
        </div>
      </div>

      <div className="canvas-area">
        <div className="canvas-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <div className="status-bar">
          <div className="status-bar-engine">C++ Phasor Kernel · {uiMode.toUpperCase()} Active</div>
        </div>
      </div>

      <div className="sidebar-right">
        <div className="basic-only">
          <div className="section-label">Summary</div>
          <MetricCard 
            label="Load Type" 
            value={Math.abs(phasors?.phi || 0) < 0.1 ? "Resistive" : (phasors?.phi || 0) > 0 ? "Inductive" : "Capacitive"} 
            unit="" 
          />
        </div>

        <div className="advanced-only">
          <div className="section-label">Vector Analysis</div>
          {phasors && (
            <>
              <MetricCard label="Phase Angle φ" value={(phasors.phi * 180 / Math.PI).toFixed(1)} unit="°" />
              <MetricCard label="Z (Impedance)" value={phasors.z.toFixed(1)} unit="Ω" />
              <div className="divider" />
              <div className="section-label">Polar Forms (Mag ∠ deg)</div>
              <div className="formula-box" style={{ fontSize: '10px' }}>
                VR: {(Math.sqrt(phasors.vr.real**2 + phasors.vr.imag**2)).toFixed(1)}V ∠ {(Math.atan2(phasors.vr.imag, phasors.vr.real) * 180/Math.PI).toFixed(0)}°
              </div>
              <div className="formula-box" style={{ fontSize: '10px', marginTop: '5px' }}>
                VL: {(Math.sqrt(phasors.vl.real**2 + phasors.vl.imag**2)).toFixed(1)}V ∠ {(Math.atan2(phasors.vl.imag, phasors.vl.real) * 180/Math.PI).toFixed(0)}°
              </div>
              <div className="formula-box" style={{ fontSize: '10px', marginTop: '5px' }}>
                VC: {(Math.sqrt(phasors.vc.real**2 + phasors.vc.imag**2)).toFixed(1)}V ∠ {(Math.atan2(phasors.vc.imag, phasors.vc.real) * 180/Math.PI).toFixed(0)}°
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
