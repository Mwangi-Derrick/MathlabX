import React, { useState, useEffect } from 'react'
import { useWaveEngine } from '../hooks/useWaveEngine'
import { WaveCanvas } from '../components/WaveCanvas'
import { Slider } from '../components/Slider'
import { ToggleButton } from '../components/ToggleButton'
import { MetricCard } from '../components/MetricCard'

export const ACSignalsPage: React.FC = () => {
  const { points, generateSine, generateCosine, loading } = useWaveEngine()

  // State
  const [waveMode, setWaveMode] = useState<'sin' | 'cos' | 'both'>('sin')
  const [showGrid, setShowGrid] = useState(true)
  const [amplitude, setAmplitude] = useState(100)
  const [frequency, setFrequency] = useState(0.02)
  const [phase, setPhase] = useState(0)
  const [samples, setSamples] = useState(800)
  const [t, setT] = useState(0)

  // Animation loop
  useEffect(() => {
    const animFrame = setInterval(() => {
      setT((prev) => prev + 0.4)
    }, 1000 / 60)
    return () => clearInterval(animFrame)
  }, [])

  // Generate wave on parameter change
  useEffect(() => {
    if (waveMode === 'sin') {
      generateSine(amplitude, frequency * 1000) // Convert to internal scale
    } else if (waveMode === 'cos') {
      generateCosine(amplitude, frequency * 1000)
    }
  }, [amplitude, frequency, waveMode, generateSine])

  // Calculate metrics
  const vmax = amplitude
  const vrms = amplitude / Math.sqrt(2)
  const period = frequency > 0 ? 1 / frequency : Infinity
  const omega = 2 * Math.PI * frequency
  const currentV =
    waveMode === 'cos'
      ? amplitude * Math.cos(omega * t + phase)
      : amplitude * Math.sin(omega * t + phase)

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-cet-slate-600 border-t-cet-blue-600 rounded-full mb-4"></div>
          <p className="text-cet-slate-300">Loading Wasm Engine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-56 bg-cet-slate-800 border-r border-cet-slate-700 overflow-y-auto p-4">
          {/* Waveform Section */}
          <div className="mb-5">
            <div className="text-xs uppercase font-semibold text-cet-slate-500 tracking-widest mb-2">
              Waveform
            </div>
            <div className="flex gap-1">
              <ToggleButton
                label="sin"
                isActive={waveMode === 'sin'}
                onClick={() => setWaveMode('sin')}
                variant="sin"
              />
              <ToggleButton
                label="cos"
                isActive={waveMode === 'cos'}
                onClick={() => setWaveMode('cos')}
                variant="cos"
              />
              <ToggleButton
                label="both"
                isActive={waveMode === 'both'}
                onClick={() => setWaveMode('both')}
                variant="both"
              />
            </div>
          </div>

          {/* Parameters Section */}
          <div className="mb-5">
            <div className="text-xs uppercase font-semibold text-cet-slate-500 tracking-widest mb-3">
              Parameters
            </div>
            <Slider
              label="Amplitude"
              value={amplitude}
              min={10}
              max={200}
              step={1}
              onChange={setAmplitude}
            />
            <Slider
              label="Frequency"
              value={frequency}
              min={0.001}
              max={0.1}
              step={0.001}
              onChange={setFrequency}
              formatValue={(val) => val.toFixed(3)}
            />
            <Slider
              label="Phase φ"
              value={phase}
              min={0}
              max={2 * Math.PI}
              step={0.01}
              onChange={setPhase}
              formatValue={(val) => val.toFixed(2) + ' rad'}
            />
          </div>

          {/* Display Section */}
          <div className="mb-5">
            <div className="text-xs uppercase font-semibold text-cet-slate-500 tracking-widest mb-3">
              Display
            </div>
            <Slider
              label="Grid"
              value={showGrid ? 1 : 0}
              min={0}
              max={1}
              step={1}
              onChange={(val) => setShowGrid(val === 1)}
              formatValue={(val) => (val === 1 ? 'on' : 'off')}
            />
            <Slider
              label="Samples"
              value={samples}
              min={200}
              max={2000}
              step={50}
              onChange={setSamples}
            />
          </div>

          {/* Phase Map */}
          <div className="mb-5">
            <div className="text-xs uppercase font-semibold text-cet-slate-500 tracking-widest mb-3">
              Phase Map
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-cet-blue-50/20 border border-cet-blue-600/30">
                <div className="w-1.5 h-1.5 rounded-full bg-cet-blue-600"></div>
                <span className="text-cet-blue-400">Phase 1 — Active</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-cet-green-50/20 border border-cet-green-600/30 opacity-50">
                <div className="w-1.5 h-1.5 rounded-full bg-cet-green-600"></div>
                <span className="text-cet-green-400">Phase 2 — Phasor</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-cet-orange-50/20 border border-cet-orange-600/30 opacity-50">
                <div className="w-1.5 h-1.5 rounded-full bg-cet-orange-600"></div>
                <span className="text-cet-orange-400">Phase 3 — EM Field</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 bg-cet-slate-700 flex flex-col p-4">
          {/* Canvas */}
          <div className="flex-1 min-h-0 mb-4">
            <WaveCanvas points={points} waveMode={waveMode} showGrid={showGrid} />
          </div>

          {/* Status Bar */}
          <div className="bg-cet-slate-800 border border-cet-slate-700 rounded-md px-4 py-3 flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cet-blue-600"></div>
              <span className="text-cet-slate-400">V(t)</span>
              <span className="font-mono text-cet-slate-200">{currentV.toFixed(1)}V</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cet-green-600"></div>
              <span className="text-cet-slate-400">ω</span>
              <span className="font-mono text-cet-slate-200">{omega.toFixed(3)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
              <span className="text-cet-slate-400">T</span>
              <span className="font-mono text-cet-slate-200">
                {period === Infinity ? '∞' : period.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cet-orange-600"></div>
              <span className="text-cet-slate-400">t</span>
              <span className="font-mono text-cet-slate-200">{(t * 0.001).toFixed(3)}s</span>
            </div>
            <div className="ml-auto text-cet-slate-500 font-mono">engine.wasm · IEEE 754 double</div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-48 bg-cet-slate-800 border-l border-cet-slate-700 overflow-y-auto p-4">
          {/* Metrics */}
          <div className="mb-5">
            <div className="text-xs uppercase font-semibold text-cet-slate-500 tracking-widest mb-3">
              Metrics
            </div>
            <div className="space-y-2">
              <MetricCard label="Vmax (peak)" value={vmax.toFixed(1)} unit="V" />
              <MetricCard label="Vrms" value={vrms.toFixed(1)} unit={`V = Vmax / √2`} />
              <MetricCard label="Period T" value={period === Infinity ? '∞' : period.toFixed(1)} unit="units" />
              <MetricCard label="ω (angular freq)" value={omega.toFixed(3)} unit="rad / unit = 2πf" />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-cet-slate-700 my-4"></div>

          {/* Formula Reference */}
          <div className="mb-5">
            <div className="text-xs uppercase font-semibold text-cet-slate-500 tracking-widest mb-3">
              Formula Ref
            </div>
            <div className="space-y-2">
              <div className="bg-cet-slate-700/50 border-l-2 border-cet-blue-600 px-2 py-1 text-xs font-mono text-cet-blue-400">
                V(t) = A·sin(ωt+φ)
              </div>
              <div className="bg-cet-slate-700/50 border-l-2 border-cet-blue-600 px-2 py-1 text-xs font-mono text-cet-blue-400">
                Vrms = A / √2
              </div>
              <div className="bg-cet-slate-700/50 border-l-2 border-cet-blue-600 px-2 py-1 text-xs font-mono text-cet-blue-400">
                ω = 2π·f
              </div>
              <div className="bg-cet-slate-700/50 border-l-2 border-cet-blue-600 px-2 py-1 text-xs font-mono text-cet-blue-400">
                T = 1 / f
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-cet-slate-700 my-4"></div>

          {/* C++ Class */}
          <div className="mb-5">
            <div className="text-xs uppercase font-semibold text-cet-slate-500 tracking-widest mb-3">
              C++ Class
            </div>
            <div className="bg-cet-slate-700/50 px-2 py-2 rounded text-xs font-mono text-cet-slate-300 leading-relaxed">
              <span className="text-purple-400">class</span>{' '}
              <span className="text-cet-slate-100">WaveEngine</span> {'{'}
              <br />
              &nbsp;&nbsp;<span className="text-purple-400">void</span>{' '}
              <span className="text-cet-blue-400">generateSine</span>(double, double);
              <br />
              &nbsp;&nbsp;<span className="text-purple-400">void</span>{' '}
              <span className="text-cet-blue-400">generateCosine</span>(double, double);
              <br />
              &nbsp;&nbsp;{'{'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
