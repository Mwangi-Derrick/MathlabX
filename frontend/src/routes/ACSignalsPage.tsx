/**
 * ACSignalsPage — AC RLC circuit simulation.
 */

import React, { useState,useCallback, useEffect, useRef } from 'react'
import { useACCircuit } from '../hooks/useACCircuit'
import { WaveCanvas } from '../components/WaveCanvas'
import { WaveCanvas3D } from '../components/WaveCanvas3D'
import { PhasorCanvas } from '../components/PhasorCanvas'
import { Slider } from '../components/Slider'
import { MetricCard } from '../components/MetricCard'
import { PageProps } from '../App'


const MAX_AMPLITUDE = 200

export const ACSignalsPage: React.FC<PageProps> = ({ uiMode }) => {
  const isAdvanced = uiMode === 'advanced'
  const {
    voltagePoints,
    currentPoints,
    metrics,
    updateParams,
    setSamples: engineSetSamples,
    loading,
    error,
    getResonantCapacitance,
    getPhasorState,
  } = useACCircuit(0, 0.05, 800)

  // ─── UI State ────────────────────────────────────────────────────────

  const [amplitude, setAmplitude] = useState(100)
  const [frequency, setFrequency] = useState(50) // Hz
  const [resistance, setResistance] = useState(50) // Ω
  const [inductance, setInductance] = useState(0.05) // H
  const [capacitance, setCapacitance] = useState(0.0001) // F
  const [samples, setSamples] = useState(800)
  const [time, setTime] = useState(0)
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d')
  const [isAutoTuneLocked, setIsAutoTuneLocked] = useState(false)

  const isResonant = Math.abs(metrics.inductiveReactance - metrics.capacitiveReactance) < 0.2

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

  const tuneToResonance = useCallback(() => {
    const resonantC = getResonantCapacitance()
    if (resonantC > 0) {
      setCapacitance(resonantC)
    }
  }, [getResonantCapacitance])

  // Cascading Resonance Effect
  useEffect(() => {
    if (isAutoTuneLocked) {
      tuneToResonance()
    }
  }, [frequency, inductance, isAutoTuneLocked, tuneToResonance])

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
        <div className="header-actions">
           <div className="view-toggle">
              <button className={viewMode === '3d' ? 'active' : ''} onClick={() => setViewMode('3d')}>3D Simulation</button>
              <button className={viewMode === '2d' ? 'active' : ''} onClick={() => setViewMode('2d')}>2D Oscilloscope</button>
           </div>
           {isResonant && <div className="resonance-badge">RESONANCE ACTIVE</div>}
        </div>

        <div className="canvas-container" style={{ height: '500px' }}>
          {viewMode === '3d' ? (
            <WaveCanvas3D 
              getPhasorState={getPhasorState}
            />
          ) : (
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
          )}
        </div>
        
        <div className="status-bar">
          <div className="stat-item">
            <div className="stat-dot" style={{ background: '#22d3ee' }} />
            <span className="stat-key">V(t)</span>
            <span className="stat-value">{amplitude}V peak</span>
          </div>
          <div className="stat-item">
            <div className="stat-dot" style={{ background: '#fbbf24' }} />
            <span className="stat-key">I(t)</span>
            <span className="stat-value">{metrics.currentAmplitude.toFixed(2)}A peak</span>
          </div>
          <div className="stat-item">
            <span className="stat-key">φ</span>
            <span className="stat-value">{(metrics.phaseAngle * 180 / Math.PI).toFixed(1)}°</span>
          </div>
        </div>
      </div>

      {/* ─── Right Panel ───────────────────────────────────────────────── */}
      <div className="sidebar-right">
        <div className="section-label">Impedance & Power</div>
        <div className="metrics-grid">
          <MetricCard label="Z (Total)" value={metrics.impedance.toFixed(1)} unit="Ω" />
          <MetricCard label="XL (Inductive)" value={metrics.inductiveReactance.toFixed(1)} unit="Ω" />
          <MetricCard label="XC (Capacitive)" value={metrics.capacitiveReactance.toFixed(1)} unit="Ω" />
          <MetricCard label="Power Factor" value={metrics.powerFactor.toFixed(3)} unit="" />
        </div>

        {isAdvanced && (
          <>
            <div className="divider" style={{ margin: '12px 0' }} />
            <div className="section-label">Detailed Power</div>
            <div className="metrics-grid">
              <MetricCard label="P (Active)" value={metrics.realPower.toFixed(1)} unit="W" />
              <MetricCard label="Q (Reactive)" value={metrics.reactivePower.toFixed(1)} unit="VAR" />
              <MetricCard label="S (Apparent)" value={metrics.apparentPower.toFixed(1)} unit="VA" />
            </div>
          </>
        )}

        <div className="divider" />

        <div className="section-group">
          <div className="section-label">Resonance Control</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button 
              className={`tune-btn ${isResonant ? 'resonant' : ''}`} 
              style={{ flex: 1, marginTop: 0 }}
              onClick={tuneToResonance}
            >
              {isResonant ? 'Resonant' : 'Instant Tune'}
            </button>
            <button 
              className={`tune-btn ${isAutoTuneLocked ? 'active' : ''}`}
              style={{ 
                flex: 1, 
                marginTop: 0, 
                background: isAutoTuneLocked ? 'var(--blue-500)' : 'transparent',
                color: isAutoTuneLocked ? '#fff' : 'var(--blue-400)'
              }}
              onClick={() => setIsAutoTuneLocked(!isAutoTuneLocked)}
            >
              {isAutoTuneLocked ? '🔒 Locked' : '🔓 Unlock'}
            </button>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            Locking maintains resonance across parameter shifts
          </div>
        </div>

        <div className="divider" />

        <div className="section-label">Vector Analysis</div>
        <div className="phasor-dashboard">
          <PhasorCanvas 
            vs={{ real: amplitude, imag: 0 }}
            vr={{ real: metrics.currentAmplitude * resistance, imag: 0 }}
            vl={{ real: 0, imag: metrics.currentAmplitude * metrics.inductiveReactance }}
            vc={{ real: 0, imag: -metrics.currentAmplitude * metrics.capacitiveReactance }}
            maxVal={amplitude * 1.2}
            time={time}
            freq={frequency}
          />
        </div>
      </div>
    </div>
  )
}
