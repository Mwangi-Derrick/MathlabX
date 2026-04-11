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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

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

  if (loading) return <div className="h-full w-full flex items-center justify-center text-white bg-black">Loading AC circuit kernel...</div>
  if (error) return <div className="h-full w-full flex items-center justify-center text-rose-500 bg-black">Error: {error}</div>

  return (
    <div className="flex flex-col md:flex-row flex-1 relative overflow-hidden bg-black w-full h-full min-h-0">
      {/* Center Canvas Area */}
      <div className="flex-1 relative bg-black flex flex-col overflow-hidden z-0 min-h-0">
        <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col md:flex-row items-center gap-3 w-max max-w-[90%]">
          <div className="flex bg-surface/80 backdrop-blur-md rounded-lg border border-border-secondary p-1 shadow-lg pointer-events-auto shrink-0">
            <button className={`px-4 py-1.5 rounded-md text-[11px] md:text-[12px] font-bold tracking-wide transition-all ${viewMode === '3d' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'text-text-secondary hover:text-text-primary hover:bg-elevated/50'}`} onClick={() => setViewMode('3d')}>
              4D Phasor-Time
            </button>
            <button className={`px-4 py-1.5 rounded-md text-[11px] md:text-[12px] font-bold tracking-wide transition-all ${viewMode === '2d' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'text-text-secondary hover:text-text-primary hover:bg-elevated/50'}`} onClick={() => setViewMode('2d')}>
              Oscilloscope
            </button>
          </div>
          {isResonant && <div className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 text-[10px] md:text-[11px] tracking-wide uppercase font-bold border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)] pointer-events-auto shrink-0">RESONANCE LOCK</div>}
        </div>

        <div className="flex-1 relative min-h-0 bg-black">
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

        {/* Bottom Status overlay */}
        <div className="absolute bottom-0 left-0 w-full h-12 flex items-center justify-between px-4 md:px-6 pointer-events-none z-10 bg-gradient-to-t from-black/90 to-transparent">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#22d3ee] shadow-[0_0_8px_theme(colors.cyan.400)]" />
              <span className="hidden md:inline text-[11px] text-text-tertiary uppercase tracking-wider">V(t) peak</span>
              <span className="text-[11px] md:text-[12px] font-bold text-text-primary font-mono">{amplitude.toFixed(0)}V</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#fbbf24] shadow-[0_0_8px_theme(colors.amber.400)]" />
              <span className="hidden md:inline text-[11px] text-text-tertiary uppercase tracking-wider">I(t) peak</span>
              <span className="text-[11px] md:text-[12px] font-bold text-text-primary font-mono">{metrics.currentAmplitude.toFixed(2)}A</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="hidden md:inline text-[11px] text-text-tertiary uppercase tracking-wider">KVL mismatch</span>
            <span className="text-[11px] md:text-[12px] font-bold text-text-primary font-mono">{kvlError.toExponential(1)}V</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          MOBILE bottom drawer (<md)
      ════════════════════════════════════════════════ */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/98 backdrop-blur-2xl border-t border-border-primary shadow-[0_-8px_32px_rgba(0,0,0,0.6)] flex flex-col transition-[height] duration-300 ease-out ${isSidebarOpen ? 'h-[55vh]' : 'h-12'}`}>
        <div
          className="h-12 flex items-center shrink-0 cursor-pointer select-none gap-3 px-4"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <svg viewBox="0 0 24 24" className={`w-4 h-4 fill-current text-text-muted transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : 'rotate-0'}`}>
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
          </svg>
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-text-tertiary">Inspector</span>
          {!isSidebarOpen && (
            <span className="text-[10px] text-text-muted font-mono ml-1">
              {frequency}Hz • {resistance}Ω • {(capacitance * 1_000_000).toFixed(0)}µF
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 flex flex-col gap-4 pb-8">
            <InspectorPanels
              amplitude={amplitude} setAmplitude={setAmplitude}
              frequency={frequency} setFrequency={setFrequency}
              resistance={resistance} setResistance={setResistance}
              inductance={inductance} setInductance={setInductance}
              capacitance={capacitance} setCapacitance={setCapacitance}
              simSpeed={simSpeed} setSimSpeed={setSimSpeed}
              samples={samples} setSamples={setSamples}
              isResonant={isResonant} isAutoTuneLocked={isAutoTuneLocked}
              setIsAutoTuneLocked={setIsAutoTuneLocked}
              tuneToResonance={tuneToResonance} resonanceGap={resonanceGap}
              metrics={metrics} phasorReference={phasorReference}
              phasorCanvasMax={phasorCanvasMax} time={time} freqError={freqError}
              freqLoading={freqLoading} freqAnalysis={freqAnalysis}
              isAdvanced={isAdvanced}
            />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          DESKTOP / TABLET right sidebar (md+)
          Always a flex sibling — never fixed/absolute.
          Collapses to w-12 (icon strip), expands to w-[320px].
      ════════════════════════════════════════════════ */}
      <div className={`hidden md:flex flex-col h-full bg-surface/95 backdrop-blur-2xl border-l border-border-primary shadow-[-8px_0_24px_rgba(0,0,0,0.5)] shrink-0 transition-[width] duration-300 ease-out z-20 ${isSidebarOpen ? 'w-[340px]' : 'w-12'}`}>
        {/* Header row */}
        <div className="h-12 border-b border-border-primary flex items-center shrink-0">
          <button
            className="w-12 h-12 flex items-center justify-center hover:bg-elevated text-text-muted hover:text-text-primary transition-colors shrink-0 outline-none"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Collapse Inspector' : 'Expand Inspector'}
          >
            <svg viewBox="0 0 24 24" className={`w-5 h-5 fill-current transition-transform duration-300 ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`}>
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
            </svg>
          </button>
          {isSidebarOpen && (
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-text-tertiary px-2 whitespace-nowrap">Inspector</span>
          )}
        </div>

        {/* Scrollable content — only shown when open */}
        {isSidebarOpen && (
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 flex flex-col gap-4">
              <InspectorPanels
                amplitude={amplitude} setAmplitude={setAmplitude}
                frequency={frequency} setFrequency={setFrequency}
                resistance={resistance} setResistance={setResistance}
                inductance={inductance} setInductance={setInductance}
                capacitance={capacitance} setCapacitance={setCapacitance}
                simSpeed={simSpeed} setSimSpeed={setSimSpeed}
                samples={samples} setSamples={setSamples}
                isResonant={isResonant} isAutoTuneLocked={isAutoTuneLocked}
                setIsAutoTuneLocked={setIsAutoTuneLocked}
                tuneToResonance={tuneToResonance} resonanceGap={resonanceGap}
                metrics={metrics} phasorReference={phasorReference}
                phasorCanvasMax={phasorCanvasMax} time={time} freqError={freqError}
                freqLoading={freqLoading} freqAnalysis={freqAnalysis}
                isAdvanced={isAdvanced}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared panel content for both desktop sidebar and mobile drawer ───────────
interface InspectorPanelsProps {
  amplitude: number; setAmplitude: (v: number) => void
  frequency: number; setFrequency: (v: number) => void
  resistance: number; setResistance: (v: number) => void
  inductance: number; setInductance: (v: number) => void
  capacitance: number; setCapacitance: (v: number) => void
  simSpeed: number; setSimSpeed: (v: number) => void
  samples: number; setSamples: (v: number) => void
  isResonant: boolean; isAutoTuneLocked: boolean
  setIsAutoTuneLocked: (fn: (p: boolean) => boolean) => void
  tuneToResonance: () => void; resonanceGap: number
  metrics: any; phasorReference: any
  phasorCanvasMax: number; time: number
  freqError: string | null; freqLoading: boolean; freqAnalysis: any
  isAdvanced: boolean
}

function InspectorPanels({
  amplitude, setAmplitude, frequency, setFrequency, resistance, setResistance,
  inductance, setInductance, capacitance, setCapacitance, simSpeed, setSimSpeed,
  samples, setSamples, isResonant, isAutoTuneLocked, setIsAutoTuneLocked,
  tuneToResonance, resonanceGap, metrics, phasorReference, phasorCanvasMax,
  time, freqError, freqLoading, freqAnalysis, isAdvanced,
}: InspectorPanelsProps) {
  return (
    <>
      {/* ── Source ── */}
      <div className="bg-elevated rounded-xl p-4 border border-border-subtle">
        <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_theme(colors.blue.500)]"></span> Source
        </div>
        <Slider label="Voltage Vm" value={amplitude} min={10} max={MAX_AMPLITUDE} step={1} onChange={setAmplitude} formatValue={(v) => `${v}V`} />
        <Slider label="Frequency f" value={frequency} min={5} max={400} step={1} onChange={setFrequency} formatValue={(v) => `${v}Hz`} />
      </div>

      {/* ── RLC Load ── */}
      <div className="bg-elevated rounded-xl p-4 border border-border-subtle">
        <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_theme(colors.indigo.500)]"></span> RLC Load
        </div>
        <Slider label="Resistance R" value={resistance} min={1} max={200} step={1} onChange={setResistance} formatValue={(v) => `${v}Ω`} />
        <Slider label="Inductance L" value={inductance} min={0.001} max={1.0} step={0.001} onChange={setInductance} formatValue={(v) => `${v.toFixed(3)}H`} />
        <Slider label="Capacitance C" value={capacitance * 1_000_000} min={1} max={500} step={1} onChange={(v) => setCapacitance(v / 1_000_000)} formatValue={(v) => `${v.toFixed(0)}µF`} />
      </div>

      {/* ── Resonance ── */}
      <div className="bg-elevated rounded-xl p-4 border border-border-subtle">
        <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_theme(colors.rose.500)]"></span> Resonance
        </div>
        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2.5 rounded-lg border text-[11px] font-bold tracking-wide uppercase transition-all flex-1 ${isResonant ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-secondary border-border-primary text-text-secondary hover:bg-elevated hover:text-text-primary'}`}
            onClick={tuneToResonance}
          >
            {isResonant ? 'Resonant' : 'Instant Tune'}
          </button>
          <button
            className={`px-4 py-2.5 rounded-lg border text-[11px] font-bold tracking-wide uppercase transition-all flex-1 ${isAutoTuneLocked ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-transparent border-blue-500/30 text-blue-400 hover:bg-blue-500/10'}`}
            onClick={() => setIsAutoTuneLocked((prev) => !prev)}
          >
            {isAutoTuneLocked ? '🔒 Lock On' : '🔓 Lock Off'}
          </button>
        </div>
        <div className="text-[13px] text-blue-400 text-center font-mono tracking-wide py-3 bg-secondary rounded-lg border border-border-secondary">
          |XL − XC| = {resonanceGap.toFixed(4)} Ω
        </div>
      </div>

      {/* ── Impedance Snapshot ── */}
      <div className="bg-elevated rounded-xl p-4 border border-border-subtle">
        <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Impedance Snapshot
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard label="Z (Total)" value={metrics.impedance.toFixed(2)} unit="Ω" />
          <MetricCard label="XL" value={metrics.inductiveReactance.toFixed(2)} unit="Ω" />
          <MetricCard label="XC" value={metrics.capacitiveReactance.toFixed(2)} unit="Ω" />
          <MetricCard label="Power Factor" value={metrics.powerFactor.toFixed(4)} />
        </div>
      </div>

      {/* ── Power Decomposition (Advanced) ── */}
      {isAdvanced && (
        <div className="bg-elevated rounded-xl p-4 border border-border-subtle">
          <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_5px_theme(colors.orange.400)]"></span> Power Decomposition
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="P" value={metrics.realPower.toFixed(2)} unit="W" />
            <MetricCard label="Q" value={metrics.reactivePower.toFixed(2)} unit="VAR" />
            <MetricCard label="S" value={metrics.apparentPower.toFixed(2)} unit="VA" />
            <MetricCard label="φ" value={((metrics.phaseAngle * 180) / Math.PI).toFixed(2)} unit="°" />
          </div>
        </div>
      )}

      {/* ── Live Phasor Snapshot ── */}
      <div className="bg-elevated rounded-xl p-4 border border-border-subtle">
        <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_theme(colors.cyan.500)]"></span> Live Phasor Snapshot
        </div>
        <div className="bg-secondary rounded-xl border border-border-secondary p-2 overflow-hidden h-[220px]">
          <PhasorCanvas
            vs={{ real: phasorReference?.vs_real ?? amplitude, imag: phasorReference?.vs_imag ?? 0 }}
            vr={{ real: phasorReference?.vr_real ?? (metrics.currentAmplitude * resistance), imag: phasorReference?.vr_imag ?? 0 }}
            vl={{ real: phasorReference?.vl_real ?? 0, imag: phasorReference?.vl_imag ?? (metrics.currentAmplitude * metrics.inductiveReactance) }}
            vc={{ real: phasorReference?.vc_real ?? 0, imag: phasorReference?.vc_imag ?? (-metrics.currentAmplitude * metrics.capacitiveReactance) }}
            maxVal={phasorCanvasMax}
            time={time}
            freq={frequency}
          />
        </div>
      </div>

      {/* ── Frequency Domain (Advanced) ── */}
      {isAdvanced && (
        <div className="bg-elevated rounded-xl p-4 border border-border-subtle">
          <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_theme(colors.purple.500)]"></span> Frequency Domain
          </div>
          {freqError && <div className="text-[11px] text-red-500 mb-2">Sweep error: {freqError}</div>}
          {freqLoading ? (
            <div className="text-[11px] text-text-tertiary">Initializing frequency engine...</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="f0" value={freqAnalysis.resonantFrequency.toFixed(2)} unit="Hz" />
              <MetricCard label="BW" value={freqAnalysis.bandwidth.toFixed(2)} unit="Hz" />
              <MetricCard label="Q" value={freqAnalysis.qualityFactor.toFixed(3)} />
              <MetricCard label="Peak |H|" value={freqAnalysis.peakGainDb.toFixed(2)} unit="dB" />
            </div>
          )}
        </div>
      )}

      {/* ── Simulation Engine ── */}
      <div className="bg-elevated rounded-xl p-4 border border-border-subtle">
        <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_theme(colors.emerald.500)]"></span> Simulation Engine
        </div>
        <Slider label="Sim Speed" value={simSpeed} min={0.01} max={3} step={0.01} onChange={setSimSpeed} formatValue={(v) => `${v.toFixed(2)}x`} />
        <Slider label="Samples" value={samples} min={200} max={2400} step={50} onChange={setSamples} formatValue={(v) => `${v}`} />
      </div>
    </>
  )
}
