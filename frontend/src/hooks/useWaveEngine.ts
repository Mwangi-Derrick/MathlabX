/**
 * useWaveEngine — React hook for interacting with the C++ WASM engine.
 * 
 * Lifecycle:
 *   1. On mount: loads WASM module and creates a WaveEngine instance
 *   2. Provides a generate() function that calls C++ methods for any mode
 *   3. Maintains separate sinePoints and cosinePoints for "both" mode
 *   4. On unmount: calls engine.delete() to free C++ heap memory
 * 
 * All slider parameters (amplitude, frequency, phase, samples) are passed
 * through to the C++ engine — no waveform computation is done in JavaScript.
 * The engine does the math, JS just renders the results.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { WaveEngineInstance, Point2D } from '../lib/types'
import { createWaveEngine } from '../lib/wasmLoader'

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

  // Use a ref for the engine instance so:
  //   1. The cleanup function always has the latest reference (no stale closure)
  //   2. We don't trigger re-renders when the engine reference changes
  const engineRef = useRef<WaveEngineInstance | null>(null)
  const mountedRef = useRef(true)

  // ─── Initialize WASM engine on mount ──────────────────────────────────

  useEffect(() => {
    mountedRef.current = true

    const init = async () => {
      try {
        const engine = await createWaveEngine(-500, 500, 800)
        
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
          console.log('[Hook] ✓ WaveEngine instance freed')
        } catch (e) {
          // Engine may already be deleted in some edge cases
          console.warn('[Hook] Engine cleanup warning:', e)
        }
        engineRef.current = null
      }
    }
  }, [])

  // ─── Convert Emscripten vector to JS array ──────────────────────────

  /**
   * Emscripten's register_vector<Point2D> produces a wrapper with .size() and .get(i),
   * NOT a regular JavaScript array. We must convert it to use in React state.
   * We also call .delete() on the vector wrapper to free its C++ memory.
   */
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

    // Free the temporary vector wrapper (the engine's internal vector is unaffected)
    wasmVector.delete()

    return result
  }, [])

  // ─── Unified generate function ────────────────────────────────────────
  //
  // This is the single entry point for all waveform generation.
  // In "both" mode, we call the C++ engine twice: once for sine, once for cosine.
  // Each call goes through the C++ WaveEngine → generates points → returns to JS.

  const generate = useCallback(
    (mode: WaveMode, amplitude: number, frequency: number, phase: number) => {
      const engine = engineRef.current
      if (!engine) return

      try {
        if (mode === 'sin' || mode === 'both') {
          // Call C++ generateSine(amplitude, frequency, phase)
          engine.generateSine(amplitude, frequency, phase)
          const raw = engine.getPoints()
          setSinePoints(extractPoints(raw))
        }

        if (mode === 'cos' || mode === 'both') {
          // Call C++ generateCosine(amplitude, frequency, phase)
          engine.generateCosine(amplitude, frequency, phase)
          const raw = engine.getPoints()
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
