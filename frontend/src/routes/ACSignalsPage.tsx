import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WaveCanvas } from '../components/WaveCanvas'
import { WaveCanvas3D } from '../components/WaveCanvas3D'
import { PhasorCanvas } from '../components/PhasorCanvas'
import { Slider } from '../components/Slider'
import { MetricCard } from '../components/MetricCard'
import { useACCircuit } from '../hooks/useACCircuit'
import { useFrequencyResponse } from '../hooks/useFrequencyResponse'
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

  const {
    loading: freqLoading,
    error: freqError,
    analysis: freqAnalysis,
    analyze: analyzeFrequencyResponse,
  } = useFrequencyResponse(0, 0.05, 800)

  const [amplitude, setAmplitude] = useState(100)
  const [frequency, setFrequency] = useState(50)
  const [resistance, setResistance] = useState(50)
  const [inductance, setInductance] = useState(0.05)
  const [capacitance, setCapacitance] = useState(0.0001)
  const [samples, setSamples] = useState(800)
  const [time, setTime] = useState(0)
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d')
  const [isAutoTuneLocked, setIsAutoTuneLocked] = useState(false)
  const [simSpeed, setSimSpeed] = useState(0.25)

  const speedRef = useRef(simSpeed)
  const animRef = useRef<number>(0)
  const lastFrameTimeRef = useRef<number>(0)

  useEffect(() => {
    speedRef.current = simSpeed
  }, [simSpeed])

  useEffect(() => {
    let mounted = true
    const tick = (now: number) => {
      if (!mounted) return
      const last = lastFrameTimeRef.current || now
      const dt = Math.max(0, (now - last) / 1000)
      lastFrameTimeRef.current = now
      setTime((prev) => prev + dt * speedRef.current)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => {
      mounted = false
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  const tuneToResonance = useCallback(() => {
    const resonantC = getResonantCapacitance()
    if (resonantC > 0) {
      setCapacitance(resonantC)
    }
  }, [getResonantCapacitance])

  useEffect(() => {
    if (!isAutoTuneLocked) return
    tuneToResonance()
  }, [frequency, inductance, isAutoTuneLocked, tuneToResonance])

  useEffect(() => {
    if (loading || error) return
    updateParams(resistance, inductance, capacitance, amplitude, frequency)
  }, [amplitude, capacitance, error, frequency, inductance, loading, resistance, updateParams])

  useEffect(() => {
    engineSetSamples(samples)
  }, [samples, engineSetSamples])

  useEffect(() => {
    if (loading || error || freqLoading) return
    const startHz = Math.max(0.5, frequency / 30)
    const endHz = Math.max(200, frequency * 80)
    analyzeFrequencyResponse(resistance, inductance, capacitance, startHz, endHz, 180)
  }, [
    analyzeFrequencyResponse,
    capacitance,
    error,
    freqLoading,
    frequency,
    inductance,
    loading,
    resistance,
  ])

  const phasorState = useMemo(() => getPhasorState(time), [getPhasorState, time])
  const phasorReference = useMemo(
    () => getPhasorState(0),
    [amplitude, capacitance, frequency, getPhasorState, inductance, resistance]
  )

  const resonanceGap = Math.abs(metrics.inductiveReactance - metrics.capacitiveReactance)
  const isResonant = resonanceGap < 0.2

  const kvlError = phasorState
    ? Math.hypot(
      phasorState.vr_real + phasorState.vl_real + phasorState.vc_real - phasorState.vs_real,
      phasorState.vr_imag + phasorState.vl_imag + phasorState.vc_imag - phasorState.vs_imag
    )
    : 0

  const phasorCanvasMax = useMemo(() => {
    if (!phasorReference) return amplitude * 1.2
    const mags = [
      Math.hypot(phasorReference.vs_real, phasorReference.vs_imag),
      Math.hypot(phasorReference.vr_real, phasorReference.vr_imag),
      Math.hypot(phasorReference.vl_real, phasorReference.vl_imag),
      Math.hypot(phasorReference.vc_real, phasorReference.vc_imag),
    ]
    return Math.max(amplitude * 1.1, ...mags) * 1.1
  }, [amplitude, phasorReference])

  if (loading) return <div>Loading AC circuit kernel...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="grid grid-cols-[220px_1fr_200px] flex-1 overflow-hidden">
      <div className="bg-primary border-r border-border-primary py-4 px-3 overflow-y-auto">
        <div className="mb-5">
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Source</div>
          <Slider
            label="Voltage Vm"
            value={amplitude}
            min={10}
            max={MAX_AMPLITUDE}
            step={1}
            onChange={setAmplitude}
            formatValue={(v) => `${v}V`}
          />
          <Slider
            label="Frequency f"
            value={frequency}
            min={5}
            max={400}
            step={1}
            onChange={setFrequency}
            formatValue={(v) => `${v}Hz`}
          />
        </div>

        <div className="mb-5">
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Load (RLC)</div>
          <Slider
            label="Resistance R"
            value={resistance}
            min={1}
            max={200}
            step={1}
            onChange={setResistance}
            formatValue={(v) => `${v}Ω`}
          />
          <Slider
            label="Inductance L"
            value={inductance}
            min={0.001}
            max={1.0}
            step={0.001}
            onChange={setInductance}
            formatValue={(v) => `${v.toFixed(3)}H`}
          />
          <Slider
            label="Capacitance C"
            value={capacitance * 1_000_000}
            min={1}
            max={500}
            step={1}
            onChange={(v) => setCapacitance(v / 1_000_000)}
            formatValue={(v) => `${v.toFixed(0)}µF`}
          />
        </div>

        <div className="mb-5">
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Simulation</div>
          <Slider
            label="Sim Speed"
            value={simSpeed}
            min={0.01}
            max={3}
            step={0.01}
            onChange={setSimSpeed}
            formatValue={(v) => `${v.toFixed(2)}x`}
          />
          <Slider
            label="Samples"
            value={samples}
            min={200}
            max={2400}
            step={50}
            onChange={setSamples}
            formatValue={(v) => `${v}`}
          />
        </div>
      </div>

      <div className="bg-black flex flex-col overflow-hidden relative">
        <div className="flex justify-between items-center px-4 py-3 absolute top-0 w-full z-10 pointer-events-none">
          <div className="flex gap-1 bg-primary/80 backdrop-blur-md rounded border border-border-primary p-1 pointer-events-auto">
            <button className={`px-3 py-1 rounded text-[11px] font-semibold transition-all ${viewMode === '3d' ? 'bg-blue-600 text-white' : 'text-text-secondary hover:bg-secondary'}`} onClick={() => setViewMode('3d')}>
              4D Phasor-Time
            </button>
            <button className={`px-3 py-1 rounded text-[11px] font-semibold transition-all ${viewMode === '2d' ? 'bg-blue-600 text-white' : 'text-text-secondary hover:bg-secondary'}`} onClick={() => setViewMode('2d')}>
              Oscilloscope
            </button>
          </div>
          {isResonant && <div className="px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-[10px] uppercase font-bold border border-orange-500/50">RESONANCE LOCK</div>}
        </div>

        <div className="flex-1 relative p-4 min-h-0 bg-black pt-12">
          {viewMode === '3d' ? (
            <WaveCanvas3D phasorState={phasorState} simTime={time} analysis={freqAnalysis} />
          ) : (
            <WaveCanvas
              sinePoints={voltagePoints}
              cosinePoints={currentPoints}
              waveMode="both"
              showGrid
              time={time}
              amplitude={amplitude}
              frequency={frequency}
              phase={metrics.phaseAngle}
              maxAmplitude={MAX_AMPLITUDE}
            />
          )}
        </div>

        <div className="h-9 border-t border-border-primary flex items-center gap-4 px-4 bg-primary shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]" />
            <span className="text-[11px] text-text-tertiary">V(t) peak</span>
            <span className="text-[11px] font-semibold text-text-primary font-mono">{amplitude.toFixed(1)}V</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
            <span className="text-[11px] text-text-tertiary">I(t) peak</span>
            <span className="text-[11px] font-semibold text-text-primary font-mono">{metrics.currentAmplitude.toFixed(3)}A</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-text-tertiary">KVL mismatch</span>
            <span className="text-[11px] font-semibold text-text-primary font-mono">{kvlError.toExponential(2)}V</span>
          </div>
        </div>
      </div>

      <div className="bg-primary border-l border-border-primary py-3.5 px-3 overflow-y-auto flex flex-col gap-3">
        <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Impedance & Power</div>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard label="Z (Total)" value={metrics.impedance.toFixed(2)} unit="Ω" />
          <MetricCard label="XL" value={metrics.inductiveReactance.toFixed(2)} unit="Ω" />
          <MetricCard label="XC" value={metrics.capacitiveReactance.toFixed(2)} unit="Ω" />
          <MetricCard label="Power Factor" value={metrics.powerFactor.toFixed(4)} />
        </div>

        {isAdvanced && (
          <>
            <div className="h-px bg-border-primary my-3" />
            <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Power Decomposition</div>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="P" value={metrics.realPower.toFixed(2)} unit="W" />
              <MetricCard label="Q" value={metrics.reactivePower.toFixed(2)} unit="VAR" />
              <MetricCard label="S" value={metrics.apparentPower.toFixed(2)} unit="VA" />
              <MetricCard label="φ" value={((metrics.phaseAngle * 180) / Math.PI).toFixed(2)} unit="°" />
            </div>
          </>
        )}

        <div className="h-px bg-border-primary" />

        <div className="mb-5">
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Frequency Domain (C++ Sweep)</div>
          {freqError && (
            <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 8 }}>
              Sweep error: {freqError}
            </div>
          )}
          {freqLoading ? (
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Initializing frequency engine...</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="f0" value={freqAnalysis.resonantFrequency.toFixed(2)} unit="Hz" />
              <MetricCard label="BW" value={freqAnalysis.bandwidth.toFixed(2)} unit="Hz" />
              <MetricCard label="Q" value={freqAnalysis.qualityFactor.toFixed(3)} />
              <MetricCard label="Peak |H|" value={freqAnalysis.peakGainDb.toFixed(2)} unit="dB" />
            </div>
          )}
        </div>

        <div className="h-px bg-border-primary" />

        <div className="mb-5">
          <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Resonance Control</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button
              className={`px-3 py-1.5 rounded border text-[11px] font-semibold transition-all flex-1 ${isResonant ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-secondary border-border-primary text-text-secondary hover:bg-elevated'}`}
              onClick={tuneToResonance}
            >
              {isResonant ? 'Resonant' : 'Instant Tune'}
            </button>
            <button
              className={`px-3 py-1.5 rounded border text-[11px] font-semibold transition-all flex-1 ${isAutoTuneLocked ? 'bg-blue-500 border-blue-500 text-white' : 'bg-transparent border-blue-500/30 text-blue-400 hover:bg-blue-500/10'}`}
              onClick={() => setIsAutoTuneLocked((prev) => !prev)}
            >
              {isAutoTuneLocked ? 'Lock On' : 'Lock Off'}
            </button>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            |XL − XC| = {resonanceGap.toFixed(4)} Ω
          </div>
        </div>

        <div className="h-px bg-border-primary" />

        <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-2 px-1">Phasor Snapshot (t=0)</div>
        <div className="bg-black rounded-lg border border-white/10 p-2 overflow-hidden">
          <PhasorCanvas
            vs={{
              real: phasorReference?.vs_real ?? amplitude,
              imag: phasorReference?.vs_imag ?? 0,
            }}
            vr={{
              real: phasorReference?.vr_real ?? (metrics.currentAmplitude * resistance),
              imag: phasorReference?.vr_imag ?? 0,
            }}
            vl={{
              real: phasorReference?.vl_real ?? 0,
              imag: phasorReference?.vl_imag ?? (metrics.currentAmplitude * metrics.inductiveReactance),
            }}
            vc={{
              real: phasorReference?.vc_real ?? 0,
              imag: phasorReference?.vc_imag ?? (-metrics.currentAmplitude * metrics.capacitiveReactance),
            }}
            maxVal={phasorCanvasMax}
            time={time}
            freq={frequency}
          />
        </div>
      </div>
    </div>
  )
}
