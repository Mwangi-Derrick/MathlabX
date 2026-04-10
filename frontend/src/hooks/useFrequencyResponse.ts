import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  FrequencyPoint,
  FrequencyPointVector,
  FrequencyResponseEngineInstance,
} from '../lib/types'
import { createFrequencyResponseEngine } from '../lib/wasmLoader'

export interface FrequencyDomainState {
  response: FrequencyPoint[]
  resonantFrequency: number
  bandwidth: number
  qualityFactor: number
  peakGainDb: number
  peakPhaseDeg: number
}

const EMPTY_STATE: FrequencyDomainState = {
  response: [],
  resonantFrequency: 0,
  bandwidth: 0,
  qualityFactor: 0,
  peakGainDb: 0,
  peakPhaseDeg: 0,
}

export function useFrequencyResponse(start = 0, end = 0.05, samples = 800) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<FrequencyDomainState>(EMPTY_STATE)
  const engineRef = useRef<FrequencyResponseEngineInstance | null>(null)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const engine = await createFrequencyResponseEngine(samples, start, end)
        if (!mounted) {
          engine.delete()
          return
        }
        engineRef.current = engine
        setLoading(false)
        setError(null)
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

  const analyze = useCallback(
    (
      r: number,
      l: number,
      c: number,
      startHz = 1,
      endHz = 5000,
      points = 180
    ) => {
      const engine = engineRef.current
      if (!engine) return

      try {
        engine.setCircuitParameters(r, l, c)
        engine.sweepFrequency(startHz, endHz, points)

        const responseVec: FrequencyPointVector = engine.getResponse()
        const response: FrequencyPoint[] = []
        for (let i = 0; i < responseVec.size(); i++) {
          response.push(responseVec.get(i))
        }
        responseVec.delete()

        const peak = response.reduce(
          (best, point) => (point.gain_db > best.gain_db ? point : best),
          response[0] ?? { freq: 0, gain_db: 0, phase_deg: 0 }
        )

        setAnalysis({
          response,
          resonantFrequency: engine.getResonantFrequency(),
          bandwidth: engine.getBandwidth(),
          qualityFactor: engine.getQualityFactor(),
          peakGainDb: peak.gain_db,
          peakPhaseDeg: peak.phase_deg,
        })
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    },
    []
  )

  return {
    loading,
    error,
    analysis,
    analyze,
  }
}
