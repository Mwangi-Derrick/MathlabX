import { useState, useEffect, useCallback, useRef } from 'react'
import type { PhasorEngineInstance, Complex } from '../lib/types'
import { createPhasorEngine } from '../lib/wasmLoader'

export interface PhasorData {
  vs: Complex
  vr: Complex
  vl: Complex
  vc: Complex
  phi: number
  z: number
}

export function usePhasorEngine(start: number, end: number, samples: number) {
  const [loading, setLoading] = useState(true)
  const [phasors, setPhasors] = useState<PhasorData | null>(null)
  const engineRef = useRef<PhasorEngineInstance | null>(null)

  useEffect(() => {
    let mounted = true
    createPhasorEngine(start, end, samples).then(engine => {
      if (!mounted) {
        engine.delete()
        return
      }
      engineRef.current = engine
      setLoading(false)
    })
    return () => {
      mounted = false
      engineRef.current?.delete()
    }
  }, [start, end, samples])

  const computePhasors = useCallback((r: number, l: number, c: number, vm: number, f: number) => {
    const engine = engineRef.current
    if (!engine) return

    // VR, VL, VC calculation
    const vr = engine.getVRPhasor(r, l, c, vm, f)
    const vl = engine.getVLPhasor(r, l, c, vm, f)
    const vc = engine.getVCPhasor(r, l, c, vm, f)
    
    // Explicitly set source to get correct phi and Z from base ACCircuitEngine
    engine.setCircuitParameters(r, l, c)
    engine.setSource(vm, f)

    setPhasors({
      vs: { real: vm, imag: 0 }, // Source is reference
      vr,
      vl,
      vc,
      phi: engine.getPhaseAngle(),
      z: engine.getImpedance()
    })
  }, [])

  return { loading, phasors, computePhasors }
}
