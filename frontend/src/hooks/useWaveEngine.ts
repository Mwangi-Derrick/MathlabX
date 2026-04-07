import { useState, useEffect, useCallback, useRef } from 'react'
import type { ACCircuitEngineInstance, Point2D } from '../lib/types'
import { createACCircuitEngine } from '../lib/wasmLoader'

/** Wave generation mode */
type WaveMode = 'sin' | 'cos' | 'both'

/** State returned by the hook */
interface WaveEngineState {
  /** Whether the WASM module is still loading */
  loading: boolean
  /** Error message if WASM failed to load, null otherwise */
  error: string | null
  /** Sine wave points (populated in 'sin' and 'both' modes) */
  sinePoints: Point2D[]
  /** Cosine wave points (populated in 'cos' and 'both' modes) */
  cosinePoints: Point2D[]
  /** Generate waveform(s) for the given mode — all params go to C++ */
  generate: (mode: WaveMode, amplitude: number, frequency: number, phase: number) => void
  /** Update the sample count on the engine — goes to C++ setSamples() */
  setSamples: (samples: number) => void
}

export function useWaveEngine(): WaveEngineState {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sinePoints, setSinePoints] = useState<Point2D[]>([])
  const [cosinePoints, setCosinePoints] = useState<Point2D[]>([])

  // Use a ref for the engine instance
  const engineRef = useRef<ACCircuitEngineInstance | null>(null)
  const mountedRef = useRef(true)

  // ─── Initialize WASM engine on mount ──────────────────────────────────

  useEffect(() => {
    mountedRef.current = true

    const init = async () => {
      try {
        const engine = await createACCircuitEngine(-500, 500, 800)
        
        if (!mountedRef.current) {
          // Component unmounted while we were loading — clean up immediately
          engine.delete()
          return
        }

        engineRef.current = engine
        setLoading(false)
        setError(null)
      } catch (err) {
        if (!mountedRef.current) return
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        setLoading(false)
      }
    }

    init()

    // Cleanup: free the C++ engine instance when the component unmounts
    return () => {
      mountedRef.current = false
      if (engineRef.current) {
        try {
          engineRef.current.delete()
        } catch (e) {
          console.warn('[Hook] Engine cleanup warning:', e)
        }
        engineRef.current = null
      }
    }
  }, [])

  // ─── Convert Emscripten vector to JS array ──────────────────────────

  const extractPoints = useCallback((wasmVector: any): Point2D[] => {
    const result: Point2D[] = []
    
    if (!wasmVector || typeof wasmVector.size !== 'function') {
      console.error('[Hook] Invalid vector from engine — expected .size() method')
      return result
    }

    const count = wasmVector.size()
    for (let i = 0; i < count; i++) {
      const p = wasmVector.get(i)
      result.push({ x: p.x, y: p.y })
    }

    // Free the temporary vector wrapper
    wasmVector.delete()

    return result
  }, [])

  // ─── Unified generate function ────────────────────────────────────────

  const generate = useCallback(
    (mode: WaveMode, amplitude: number, frequency: number, phase: number) => {
      const engine = engineRef.current
      if (!engine) return

      try {
        // ACCircuitEngine uses setSource + generateWaves
        // But for compatibility with the original useWaveEngine logic:
        engine.setSource(amplitude, frequency / 1000) // adjust freq scale
        engine.generateWaves()
        
        if (mode === 'sin' || mode === 'both') {
          const raw = engine.getVoltagePoints()
          setSinePoints(extractPoints(raw))
        }

        if (mode === 'cos' || mode === 'both') {
          const raw = engine.getCurrentPoints()
          setCosinePoints(extractPoints(raw))
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[Hook] generate error:', msg)
        setError(msg)
      }
    },
    [extractPoints]
  )

  const setSamples = useCallback((samples: number) => {
    const engine = engineRef.current
    if (!engine) return

    try {
      engine.setSamples(samples)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Hook] setSamples error:', msg)
    }
  }, [])

  return {
    loading,
    error,
    sinePoints,
    cosinePoints,
    generate,
    setSamples,
  }
}
