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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
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

  if (loading) return <div className="h-full w-full flex items-center justify-center text-white bg-black">Initializing Phasor Engine...</div>

  return (
    <div className="flex flex-1 relative overflow-hidden bg-black w-full h-full">
      {/* Main Canvas Area (Full width) */}
      <div className="flex-1 relative bg-black flex items-center justify-center z-0">
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
        
        {/* Subtle Bottom Status Bar Overlay */}
        <div className="absolute bottom-0 left-0 w-full h-8 flex items-center px-6 pointer-events-none z-10 bg-gradient-to-t from-black/80 to-transparent">
          <div className="text-[10px] text-emerald-500/50 font-mono tracking-widest uppercase">C++ Phasor Kernel Active · {frequency}Hz</div>
        </div>
      </div>

      {/* Right Sidebar - Docked, Collapsible */}
      <div 
        className={`fixed md:relative top-0 right-0 h-full bg-surface/95 backdrop-blur-2xl border-l border-border-primary shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out shrink-0 z-20 flex flex-col ${
          isSidebarOpen ? 'w-[calc(100%-48px)] md:w-[380px] translate-x-0' : 'w-[calc(100%-48px)] md:w-12 translate-x-full md:translate-x-0'
        }`}
      >
        {/* Toggle Header / Tab */}
        <div className="h-12 border-b border-border-primary flex items-center shrink-0 absolute md:static -left-12 md:left-0 top-0 bg-surface/95 md:bg-transparent backdrop-blur-2xl md:backdrop-blur-none border-l md:border-l-0 shadow-[-5px_0_15px_rgba(0,0,0,0.2)] md:shadow-none transition-all">
          <button 
            className="w-12 h-12 flex items-center justify-center hover:bg-elevated text-text-muted hover:text-text-primary transition-colors shrink-0 outline-none"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Collapse Properties" : "Expand Properties"}
          >
            <svg viewBox="0 0 24 24" className={`w-5 h-5 fill-current transition-transform duration-300 ${isSidebarOpen ? 'rotate-180 md:rotate-180' : 'rotate-180 md:rotate-0'}`}>
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
            </svg>
          </button>
          
          <div className="overflow-hidden whitespace-nowrap flex-1 px-4 md:px-2">
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-text-tertiary">Inspector</span>
          </div>
        </div>

        {/* Panel Content */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden transition-opacity duration-300 delay-100`}>
          <div className="p-4 md:p-5 flex flex-col gap-4 md:gap-6 pt-16 md:pt-5">
            
            {/* Source Module */}
            <div className="bg-elevated rounded-xl p-4 md:p-5 border border-border-subtle shadow-sm">
              <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 md:mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_theme(colors.blue.500)]"></span> Source Signal
              </div>
              <div className="flex flex-col gap-2 md:gap-4">
                <Slider label="Amplitude" value={amplitude} min={10} max={200} step={1} onChange={setAmplitude} />
                <Slider label="Frequency" value={frequency} min={1} max={100} step={1} onChange={setFrequency} />
              </div>
            </div>

            {/* Load Module */}
            <div className="bg-elevated rounded-xl p-4 md:p-5 border border-border-subtle shadow-sm">
              <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 md:mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_theme(colors.indigo.500)]"></span> Load Element (RLC)
              </div>
              <div className="flex flex-col gap-2 md:gap-4">
                <Slider label="R (Ω)" value={resistance} min={1} max={200} step={1} onChange={setResistance} />
                <Slider label="L (H)" value={inductance} min={0.01} max={1} step={0.01} onChange={setInductance} />
                <Slider label="C (µF)" value={capacitance * 1000000} min={1} max={500} step={1} onChange={(v) => setCapacitance(v / 1000000)} />
              </div>
            </div>

            {uiMode === 'basic' && (
              <div className="bg-elevated rounded-xl p-4 md:p-5 border border-border-subtle shadow-sm">
                <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 md:mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Summary
                </div>
                <MetricCard 
                  label="Load Type" 
                  value={Math.abs(phasors?.phi || 0) < 0.1 ? "Resistive" : (phasors?.phi || 0) > 0 ? "Inductive" : "Capacitive"} 
                  unit="" 
                />
              </div>
            )}

            {uiMode === 'advanced' && (
              <>
                {/* Advanced Vector Controls */}
                <div className="bg-elevated rounded-xl p-4 md:p-5 border border-border-subtle shadow-sm">
                  <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 md:mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_theme(colors.purple.500)]"></span> Vector Analysis
                  </div>
                  
                  <button 
                    className={`w-full flex justify-center items-center py-3 px-4 text-[11px] font-bold tracking-wider uppercase transition-all duration-200 rounded-lg mb-5 shadow-sm ${
                      isAnimated 
                        ? 'bg-blue-600 border border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                        : 'bg-secondary text-text-secondary hover:bg-elevated hover:text-white border border-border-secondary'
                    }`}
                    onClick={() => setIsAnimated(!isAnimated)}
                  >
                    {isAnimated ? '⏸️ Stop Rotation' : '▶️ Animate Rotation'}
                  </button>
                  
                  {phasors && (
                    <div className="flex flex-col gap-3">
                      <MetricCard label="Phase Angle φ" value={(phasors.phi * 180 / Math.PI).toFixed(1)} unit="°" />
                      <MetricCard label="Z (Impedance)" value={phasors.z.toFixed(1)} unit="Ω" />
                    </div>
                  )}
                </div>

                {/* Polar Form Outputs */}
                {phasors && (
                  <div className="bg-elevated rounded-xl p-4 md:p-5 border border-border-subtle shadow-sm">
                    <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.1em] mb-4 md:mb-5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_theme(colors.cyan.500)]"></span> Polar Forms
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="bg-secondary border border-border-secondary rounded-lg py-2.5 px-3 font-mono text-[11px] md:text-[12px] text-blue-400 flex justify-between shadow-inner">
                        <span>VR:</span>
                        <span>{(Math.sqrt(phasors.vr.real**2 + phasors.vr.imag**2)).toFixed(1)}V ∠ {(Math.atan2(phasors.vr.imag, phasors.vr.real) * 180/Math.PI).toFixed(0)}°</span>
                      </div>
                      <div className="bg-secondary border border-border-secondary rounded-lg py-2.5 px-3 font-mono text-[11px] md:text-[12px] text-yellow-500 flex justify-between shadow-inner">
                        <span>VL:</span>
                        <span>{(Math.sqrt(phasors.vl.real**2 + phasors.vl.imag**2)).toFixed(1)}V ∠ {(Math.atan2(phasors.vl.imag, phasors.vl.real) * 180/Math.PI).toFixed(0)}°</span>
                      </div>
                      <div className="bg-secondary border border-border-secondary rounded-lg py-2.5 px-3 font-mono text-[11px] md:text-[12px] text-emerald-500 flex justify-between shadow-inner">
                        <span>VC:</span>
                        <span>{(Math.sqrt(phasors.vc.real**2 + phasors.vc.imag**2)).toFixed(1)}V ∠ {(Math.atan2(phasors.vc.imag, phasors.vc.real) * 180/Math.PI).toFixed(0)}°</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

