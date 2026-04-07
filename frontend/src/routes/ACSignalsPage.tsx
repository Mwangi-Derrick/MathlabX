/**
 * ACSignalsPage — AC RLC circuit simulation.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useACCircuit } from '../hooks/useACCircuit'
import { WaveCanvas } from '../components/WaveCanvas'
import { Slider } from '../components/Slider'
import { MetricCard } from '../components/MetricCard'

const MAX_AMPLITUDE = 200

export const ACSignalsPage: React.FC = () => {
  const {
    voltagePoints,
    currentPoints,
    metrics,
    updateParams,
    setSamples: engineSetSamples,
    loading,
    error,
  } = useACCircuit(0, 0.05, 800)

  // ─── UI State ────────────────────────────────────────────────────────

  const [amplitude, setAmplitude] = useState(100)
  const [frequency, setFrequency] = useState(50) // Hz
  const [resistance, setResistance] = useState(50) // Ω
  const [inductance, setInductance] = useState(0.05) // H
  const [capacitance, setCapacitance] = useState(0.0001) // F
  const [samples, setSamples] = useState(800)
  const [time, setTime] = useState(0)

  const animRef = useRef<number>(0)

  useEffect(() => {
    let running = true
    const tick = () => {
      if (!running) return
      setTime((prev) => prev + 0.001)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  useEffect(() => {
    if (loading || error) return
    updateParams(resistance, inductance, capacitance, amplitude, frequency)
  }, [amplitude, frequency, resistance, inductance, capacitance, loading, error, updateParams])

  useEffect(() => {
    engineSetSamples(samples)
  }, [samples, engineSetSamples])

  if (loading) return <div>Loading Engine...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="main-layout">
      {/* ─── Left Sidebar ──────────────────────────────────────────────── */}
      <div className="sidebar">
        <div className="section-group">
          <div className="section-label">Source</div>
          <Slider label="Voltage Vm" value={amplitude} min={10} max={MAX_AMPLITUDE} step={1} onChange={setAmplitude} formatValue={(v) => `${v}V`} />
          <Slider label="Freq f" value={frequency} min={10} max={100} step={1} onChange={setFrequency} formatValue={(v) => `${v}Hz`} />
        </div>

        <div className="section-group">
          <div className="section-label">Load (RLC)</div>
          <Slider label="Resistance R" value={resistance} min={1} max={200} step={1} onChange={setResistance} formatValue={(v) => `${v}Ω`} />
          <Slider label="Inductance L" value={inductance} min={0.01} max={1.0} step={0.01} onChange={setInductance} formatValue={(v) => `${v}H`} />
          <Slider label="Capacitance C" value={capacitance * 1000000} min={10} max={500} step={10} onChange={(v) => setCapacitance(v / 1000000)} formatValue={(v) => `${v}µF`} />
        </div>

        <div className="section-group">
          <div className="section-label">Display</div>
          <Slider label="Samples" value={samples} min={200} max={2000} step={50} onChange={setSamples} formatValue={(v) => `${v}`} />
        </div>
      </div>

      {/* ─── Main Canvas Area ──────────────────────────────────────────── */}
      <div className="canvas-area">
        <div className="canvas-container">
          <WaveCanvas
            sinePoints={voltagePoints}
            cosinePoints={currentPoints}
            waveMode="both"
            showGrid={true}
            time={time}
            amplitude={amplitude}
            frequency={frequency}
            phase={metrics.phaseAngle}
            maxAmplitude={MAX_AMPLITUDE}
          />
        </div>
        
        <div className="status-bar">
          <div className="stat-item">
            <div className="stat-dot" style={{ background: '#2563eb' }} />
            <span className="stat-key">V(t)</span>
            <span className="stat-value">{metrics.currentAmplitude.toFixed(1)}A peak</span>
          </div>
          <div className="stat-item">
            <span className="stat-key">φ</span>
            <span className="stat-value">{(metrics.phaseAngle * 180 / Math.PI).toFixed(1)}°</span>
          </div>
          <div className="status-bar-engine">engine.wasm · RLC Active</div>
        </div>
      </div>

      {/* ─── Right Panel ───────────────────────────────────────────────── */}
      <div className="sidebar-right">
        <div className="section-label">Impedance</div>
        <MetricCard label="Z (Total)" value={metrics.impedance.toFixed(1)} unit="Ω" />
        <MetricCard label="XL" value={metrics.inductiveReactance.toFixed(1)} unit="Ω" />
        <MetricCard label="XC" value={metrics.capacitiveReactance.toFixed(1)} unit="Ω" />
        
        <div className="divider" />
        
        <div className="section-label">Power</div>
        <MetricCard label="P (Active)" value={metrics.realPower.toFixed(1)} unit="W" />
        <MetricCard label="Q (Reactive)" value={metrics.reactivePower.toFixed(1)} unit="VAR" />
        <MetricCard label="S (Apparent)" value={metrics.apparentPower.toFixed(1)} unit="VA" />
        <MetricCard label="Power Factor" value={metrics.powerFactor.toFixed(3)} unit="" />
      </div>
    </div>
  )
}
