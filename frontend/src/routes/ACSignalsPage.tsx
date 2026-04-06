/**
 * ACSignalsPage — main AC waveform simulation page.
 * 
 * This is where all the pieces come together:
 *   1. useWaveEngine hook loads the C++ WASM engine
 *   2. Sliders control amplitude, frequency, phase, and samples
 *   3. Every slider change calls into the C++ engine (no JS math for waveforms)
 *   4. The engine returns computed points, which WaveCanvas renders to <canvas>
 *   5. Metrics panel shows computed values (Vmax, Vrms, T, ω)
 * 
 * Data flow:
 *   Slider → React state → useWaveEngine → C++ WaveEngine → points → WaveCanvas
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useWaveEngine } from '../hooks/useWaveEngine'
import { WaveCanvas } from '../components/WaveCanvas'
import { Slider } from '../components/Slider'
import { ToggleButton } from '../components/ToggleButton'
import { MetricCard } from '../components/MetricCard'
import type { Point2D } from '../lib/types'

export const ACSignalsPage: React.FC = () => {
  const {
    points,
    generateSine,
    generateCosine,
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

  // Store both sine and cosine points for "both" mode
  const [sinePoints, setSinePoints] = useState<Point2D[]>([])
  const [cosinePoints, setCosinePoints] = useState<Point2D[]>([])

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
  // The engine does the math; we just render the results.

  const regenerate = useCallback(() => {
    // Frequency is stored in Hz but the engine expects an angular scale factor.
    // Convert: internal_freq = frequency * 1000 to get visible oscillations
    // across the [-500, 500] domain.
    const internalFreq = frequency * 1000

    if (waveMode === 'sin') {
      generateSine(amplitude, internalFreq, phase)
    } else if (waveMode === 'cos') {
      generateCosine(amplitude, internalFreq, phase)
    } else {
      // "both" mode: generate sine, save points, then generate cosine
      generateSine(amplitude, internalFreq, phase)
    }
  }, [amplitude, frequency, phase, waveMode, generateSine, generateCosine])

  // When generate functions produce new points, route them to the correct buffer
  useEffect(() => {
    if (points.length === 0) return

    if (waveMode === 'sin') {
      setSinePoints(points)
    } else if (waveMode === 'cos') {
      setCosinePoints(points)
    } else {
      // In "both" mode, we need to generate both waves.
      // First call produces sine points, then we generate cosine.
      setSinePoints(points)
    }
  }, [points, waveMode])

  // For "both" mode: after sine points are set, generate cosine
  const bothPhaseRef = useRef<'idle' | 'sine-done'>('idle')

  useEffect(() => {
    if (waveMode === 'both' && sinePoints.length > 0 && bothPhaseRef.current === 'idle') {
      bothPhaseRef.current = 'sine-done'
      const internalFreq = frequency * 1000
      generateCosine(amplitude, internalFreq, phase)
    }
  }, [waveMode, sinePoints, amplitude, frequency, phase, generateCosine])

  useEffect(() => {
    if (waveMode === 'both' && bothPhaseRef.current === 'sine-done' && points.length > 0) {
      setCosinePoints(points)
      bothPhaseRef.current = 'idle'
    }
  }, [waveMode, points])

  // Trigger regeneration when parameters change
  useEffect(() => {
    if (!loading && !error) {
      bothPhaseRef.current = 'idle'
      regenerate()
    }
  }, [amplitude, frequency, phase, waveMode, samples, loading, error, regenerate])

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

        {/* Parameter sliders — each one calls into C++ via useWaveEngine */}
        <div className="section-group">
          <div className="section-label">Parameters</div>
          <Slider
            label="Amplitude"
            value={amplitude}
            min={10}
            max={200}
            step={1}
            onChange={setAmplitude}
            formatValue={(v) => `${v}`}
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
