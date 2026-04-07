import { useState, useEffect, useCallback, useRef } from 'react'
import type { ACCircuitEngineInstance, Point2D } from '../lib/types'
import { createACCircuitEngine } from '../lib/wasmLoader'

export interface ACCircuitState {
  loading: boolean
  error: string | null
  voltagePoints: Point2D[]
  currentPoints: Point2D[]
  metrics: {
    omega: number
    inductiveReactance: number
    capacitiveReactance: number
    impedance: number
    phaseAngle: number
    currentAmplitude: number
    powerFactor: number
    realPower: number
    reactivePower: number
    apparentPower: number
  }
  updateParams: (r: number, l: number, c: number, v: number, f: number) => void
  setSamples: (n: number) => void
}

export function useACCircuit(start: number, end: number, samples: number): ACCircuitState {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [voltagePoints, setVoltagePoints] = useState<Point2D[]>([])
  const [currentPoints, setCurrentPoints] = useState<Point2D[]>([])
  const [metrics, setMetrics] = useState<ACCircuitState['metrics']>({
    omega: 0,
    inductiveReactance: 0,
    capacitiveReactance: 0,
    impedance: 0,
    phaseAngle: 0,
    currentAmplitude: 0,
    powerFactor: 0,
    realPower: 0,
    reactivePower: 0,
    apparentPower: 0
  })

  const engineRef = useRef<ACCircuitEngineInstance | null>(null)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const engine = await createACCircuitEngine(start, end, samples)
        if (!mounted) {
          engine.delete()
          return
        }
        engineRef.current = engine
        setLoading(false)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      }
    }
    init()
    return () => {
      mounted = false
      if (engineRef.current) {
        engineRef.current.delete()
        engineRef.current = null
      }
    }
  }, [start, end, samples])

  const extractPoints = useCallback((wasmVector: any): Point2D[] => {
    const result: Point2D[] = []
    const count = wasmVector.size()
    for (let i = 0; i < count; i++) {
      const p = wasmVector.get(i)
      result.push({ x: p.x, y: p.y })
    }
    wasmVector.delete()
    return result
  }, [])

  const updateParams = useCallback((r: number, l: number, c: number, v: number, f: number) => {
    const engine = engineRef.current
    if (!engine) return

    engine.setCircuitParameters(r, l, c)
    engine.setSource(v, f)
    engine.generateWaves()

    setVoltagePoints(extractPoints(engine.getVoltagePoints()))
    setCurrentPoints(extractPoints(engine.getCurrentPoints()))

    setMetrics({
      omega: engine.getOmega(),
      inductiveReactance: engine.getInductiveReactance(),
      capacitiveReactance: engine.getCapacitiveReactance(),
      impedance: engine.getImpedance(),
      phaseAngle: engine.getPhaseAngle(),
      currentAmplitude: engine.getCurrentAmplitude(),
      powerFactor: engine.getPowerFactor(),
      realPower: engine.getRealPower(),
      reactivePower: engine.getReactivePower(),
      apparentPower: engine.getApparentPower()
    })
  }, [extractPoints])

  const setSamples = useCallback((n: number) => {
    engineRef.current?.setSamples(n)
  }, [])

  return {
    loading,
    error,
    voltagePoints,
    currentPoints,
    metrics,
    updateParams,
    setSamples
  }
}
