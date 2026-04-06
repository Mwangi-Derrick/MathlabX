/**
 * useWaveEngine — React hook for interacting with the C++ WASM engine.
 * 
 * Lifecycle:
 *   1. On mount: loads WASM module and creates a WaveEngine instance
 *   2. Provides generate functions that call C++ methods and convert results
 *   3. On unmount: calls engine.delete() to free C++ heap memory
 * 
 * All slider parameters (amplitude, frequency, phase, samples) are passed
 * through to the C++ engine — no computation is done in JavaScript.
 * The engine does the math, JS just renders the results.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { WaveEngineInstance, Point2D } from '../lib/types'
import { createWaveEngine } from '../lib/wasmLoader'

/** State returned by the hook */
interface WaveEngineState {
  /** Whether the WASM module is still loading */
  loading: boolean
  /** Error message if WASM failed to load, null otherwise */
  error: string | null
  /** Array of (x, y) points from the last generate call */
  points: Point2D[]
  /** Generate a sine wave with the given parameters — all params go to C++ */
  generateSine: (amplitude: number, frequency: number, phase: number) => void
  /** Generate a cosine wave with the given parameters — all params go to C++ */
  generateCosine: (amplitude: number, frequency: number, phase: number) => void
  /** Update the sample count on the engine — goes to C++ setSamples() */
  setSamples: (samples: number) => void
}

export function useWaveEngine(): WaveEngineState {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [points, setPoints] = useState<Point2D[]>([])

  // Use a ref for the engine instance so:
  //   1. The cleanup function always has the latest reference (no stale closure)
  //   2. We don't trigger re-renders when the engine reference changes
  const engineRef = useRef<WaveEngineInstance | null>(null)
  const mountedRef = useRef(true)

  // ─── Initialize WASM engine on mount ──────────────────────────────────────

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

  // ─── Convert Emscripten vector to JS array ──────────────────────────────

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

  // ─── Generate functions ──────────────────────────────────────────────────

  const generateSine = useCallback(
    (amplitude: number, frequency: number, phase: number) => {
      const engine = engineRef.current
      if (!engine) return

      try {
        engine.generateSine(amplitude, frequency, phase)
        const rawPoints = engine.getPoints()
        setPoints(extractPoints(rawPoints))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[Hook] generateSine error:', msg)
        setError(msg)
      }
    },
    [extractPoints]
  )

  const generateCosine = useCallback(
    (amplitude: number, frequency: number, phase: number) => {
      const engine = engineRef.current
      if (!engine) return

      try {
        engine.generateCosine(amplitude, frequency, phase)
        const rawPoints = engine.getPoints()
        setPoints(extractPoints(rawPoints))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[Hook] generateCosine error:', msg)
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
    points,
    generateSine,
    generateCosine,
    setSamples,
  }
}
