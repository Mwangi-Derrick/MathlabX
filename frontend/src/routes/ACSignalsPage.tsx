/**
 * ACSignalsPage — main AC waveform simulation page.
 * 
 * This is where all the pieces come together:
 *   1. useWaveEngine hook loads the C++ WASM engine
 *   2. Sliders control amplitude, frequency, phase, and samples
 *   3. Every slider change calls into the C++ engine (no JS math for waveforms)
 *   4. The engine returns computed points, which WaveCanvas renders to <canvas>
 *   5. The canvas uses a FIXED Y-scale so amplitude changes are VISIBLE
 * 
 * Data flow (amplitude example):
 *   Amplitude slider → 50 → C++ generateSine(50, freq, phase)
 *     → C++ computes y = 50 * sin(freq*x + phase) for each sample
 *     → Returns 800 points with y ∈ [-50, 50]
 *     → Canvas renders against fixed scale of 200 (slider max)
 *     → Wave visually fills only 25% of canvas height
 *   
 *   Amplitude slider → 200 → C++ generateSine(200, freq, phase)
 *     → C++ computes y = 200 * sin(freq*x + phase) for each sample
 *     → Returns 800 points with y ∈ [-200, 200]
 *     → Canvas renders against same fixed scale of 200
 *     → Wave fills 100% of canvas height
 */

import React, { useState, useEffect, useRef } from 'react'
import { useWaveEngine } from '../hooks/useWaveEngine'
import { WaveCanvas } from '../components/WaveCanvas'
import { Slider } from '../components/Slider'
import { ToggleButton } from '../components/ToggleButton'
import { MetricCard } from '../components/MetricCard'

/** Maximum amplitude value — must match the slider's max prop */
const MAX_AMPLITUDE = 200

export const ACSignalsPage: React.FC = () => {
  const {
    sinePoints,
    cosinePoints,
    generate,
    setSamples: engineSetSamples,
    loading,
    error,
  } = useWaveEngine()

  // ─── UI State (all wired to WASM engine) ──────────────────────────────

  const [waveMode, setWaveMode] = useState<'sin' | 'cos' | 'both'>('sin')
  const [showGrid, setShowGrid] = useState(true)
  const [amplitude, setAmplitude] = useState(100)
  const [frequency, setFrequency] = useState(0.02)
  const [phase, setPhase] = useState(0)
  const [samples, setSamples] = useState(800)
  const [time, setTime] = useState(0)

  // Animation ref for cleanup
  const animRef = useRef<number>(0)

  // ─── Animation loop (60fps time counter) ──────────────────────────────

  useEffect(() => {
    let running = true

    const tick = () => {
      if (!running) return
      setTime((prev) => prev + 0.4)
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)

    return () => {
      running = false
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  // ─── Regenerate waveform when parameters change ───────────────────────
  // Every slider triggers this effect, which calls into the C++ engine.
  // The hook's generate() function handles "both" mode internally by
  // calling C++ generateSine() then generateCosine() in sequence.

  useEffect(() => {
    if (loading || error) return

    // Frequency is stored as Hz but the engine uses an angular scale factor.
    // Multiply by 1000 to produce visible oscillations across [-500, 500] domain.
    const internalFreq = frequency * 1000

    // This single call handles all modes:
    //   'sin'  → calls C++ generateSine(amplitude, internalFreq, phase)
    //   'cos'  → calls C++ generateCosine(amplitude, internalFreq, phase)  
    //   'both' → calls C++ generateSine then generateCosine, collecting both
    generate(waveMode, amplitude, internalFreq, phase)
  }, [amplitude, frequency, phase, waveMode, samples, loading, error, generate])

  // When samples slider changes, update the C++ engine sample count
  useEffect(() => {
    engineSetSamples(samples)
  }, [samples, engineSetSamples])

  // ─── Computed metrics ─────────────────────────────────────────────────

  const vmax = amplitude
  const vrms = amplitude / Math.sqrt(2)
  const period = frequency > 0 ? 1 / frequency : Infinity
  const omega = 2 * Math.PI * frequency
  const currentV =
    waveMode === 'cos'
      ? amplitude * Math.cos(omega * time + phase)
      : amplitude * Math.sin(omega * time + phase)

  // ─── Loading state ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="spinner" />
          <p className="loading-title">Loading WASM Engine...</p>
          <p className="loading-detail">
            Initializing C++ wave computation kernel.
            This compiles WebAssembly on first load.
          </p>
        </div>
      </div>
    )
  }

  // ─── Error state ──────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-card">
          <p className="error-title">⚠️ WASM Load Error</p>
          <p className="error-message">{error}</p>
          <details className="error-details">
            <summary>Debug Info</summary>
            <p>Check browser console (F12) for details.</p>
            <p>Ensure engine.mjs and engine.wasm exist in src/wasm/</p>
          </details>
        </div>
      </div>
    )
  }

  // ─── Main UI ──────────────────────────────────────────────────────────

  return (
    <div className="main-layout">
      {/* ─── Left Sidebar ──────────────────────────────────────────────── */}
      <div className="sidebar">
        {/* Waveform selector */}
        <div className="section-group">
          <div className="section-label">Waveform</div>
          <div className="wave-toggle">
            <ToggleButton label="sin" isActive={waveMode === 'sin'} onClick={() => setWaveMode('sin')} variant="sin" />
            <ToggleButton label="cos" isActive={waveMode === 'cos'} onClick={() => setWaveMode('cos')} variant="cos" />
            <ToggleButton label="both" isActive={waveMode === 'both'} onClick={() => setWaveMode('both')} variant="both" />
          </div>
        </div>

        {/* Parameter sliders — each one triggers C++ regeneration */}
        <div className="section-group">
          <div className="section-label">Parameters</div>
          <Slider
            label="Amplitude"
            value={amplitude}
            min={10}
            max={MAX_AMPLITUDE}
            step={1}
            onChange={setAmplitude}
            formatValue={(v) => `${v}V`}
          />
          <Slider
            label="Frequency"
            value={frequency}
            min={0.001}
            max={0.1}
            step={0.001}
            onChange={setFrequency}
            formatValue={(v) => v.toFixed(3)}
          />
          <Slider
            label="Phase φ"
            value={phase}
            min={0}
            max={2 * Math.PI}
            step={0.01}
            onChange={setPhase}
            formatValue={(v) => `${v.toFixed(2)} rad`}
          />
        </div>

        {/* Display controls */}
        <div className="section-group">
          <div className="section-label">Display</div>
          <Slider
            label="Grid"
            value={showGrid ? 1 : 0}
            min={0}
            max={1}
            step={1}
            onChange={(v) => setShowGrid(v === 1)}
            formatValue={(v) => (v === 1 ? 'on' : 'off')}
          />
          <Slider
            label="Samples"
            value={samples}
            min={200}
            max={2000}
            step={50}
            onChange={setSamples}
            formatValue={(v) => `${v}`}
          />
        </div>

        {/* Phase map */}
        <div className="section-group">
          <div className="section-label">Phase Map</div>
          <div className="phase-badge phase-active">
            <div className="phase-dot" />
            Phase 1 — Active
          </div>
          <div className="phase-badge phase-phasor">
            <div className="phase-dot" />
            Phase 2 — Phasor
          </div>
          <div className="phase-badge phase-em">
            <div className="phase-dot" />
            Phase 3 — EM Field
          </div>
        </div>
      </div>

      {/* ─── Main Canvas Area ──────────────────────────────────────────── */}
      <div className="canvas-area">
        <div className="canvas-container">
          <WaveCanvas
            sinePoints={sinePoints}
            cosinePoints={cosinePoints}
            waveMode={waveMode}
            showGrid={showGrid}
            time={time}
            amplitude={amplitude}
            frequency={frequency}
            phase={phase}
            maxAmplitude={MAX_AMPLITUDE}
          />
        </div>

        {/* Status bar */}
        <div className="status-bar">
          <div className="stat-item">
            <div className="stat-dot" style={{ background: '#2563eb' }} />
            <span className="stat-key">V(t)</span>
            <span className="stat-value">{currentV.toFixed(1)}V</span>
          </div>
          <div className="stat-item">
            <div className="stat-dot" style={{ background: '#16a34a' }} />
            <span className="stat-key">ω</span>
            <span className="stat-value">{omega.toFixed(3)}</span>
          </div>
          <div className="stat-item">
            <div className="stat-dot" style={{ background: '#7c3aed' }} />
            <span className="stat-key">T</span>
            <span className="stat-value">{period === Infinity ? '∞' : period.toFixed(1)}</span>
          </div>
          <div className="stat-item">
            <div className="stat-dot" style={{ background: '#ea580c' }} />
            <span className="stat-key">t</span>
            <span className="stat-value">{(time * 0.001).toFixed(3)}s</span>
          </div>
          <div className="status-bar-engine">engine.wasm · IEEE 754 double</div>
        </div>
      </div>

      {/* ─── Right Panel ───────────────────────────────────────────────── */}
      <div className="sidebar-right">
        {/* Metrics */}
        <div className="section-label">Metrics</div>
        <MetricCard label="Vmax (peak)" value={vmax.toFixed(1)} unit="V" />
        <MetricCard label="Vrms" value={vrms.toFixed(1)} unit="V = Vmax / √2" />
        <MetricCard label="Period T" value={period === Infinity ? '∞' : period.toFixed(1)} unit="units" />
        <MetricCard label="ω (angular freq)" value={omega.toFixed(3)} unit="rad / unit = 2πf" />

        <div className="divider" />

        {/* Formula reference */}
        <div className="section-label">Formula Ref</div>
        <div className="formula-box">V(t) = A·sin(ωt+φ)</div>
        <div className="formula-box">Vrms = A / √2</div>
        <div className="formula-box">ω = 2π·f</div>
        <div className="formula-box">T = 1 / f</div>

        <div className="divider" />

        {/* C++ class preview */}
        <div className="section-label">C++ Class</div>
        <div className="code-preview">
          <span className="code-keyword">class</span>{' '}
          <span className="code-class">WaveEngine</span> {'{'}<br />
          &nbsp;&nbsp;<span className="code-keyword">void</span>{' '}
          <span className="code-method">generateSine</span>(A, f, φ);<br />
          &nbsp;&nbsp;<span className="code-keyword">void</span>{' '}
          <span className="code-method">generateCosine</span>(A, f, φ);<br />
          &nbsp;&nbsp;<span className="code-keyword">void</span>{' '}
          <span className="code-method">setSamples</span>(n);<br />
          {'}'};
        </div>
      </div>
    </div>
  )
}
