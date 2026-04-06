import { useState, useEffect, useCallback, useRef } from 'react'
import type { WaveEngineModule, WaveEngineInstance, Point2D } from '../lib/types'

declare global {
  interface Window {
    Module: any
  }
}

export const useWaveEngine = () => {
  const [engine, setEngine] = useState<WaveEngineInstance | null>(null)
  const [points, setPoints] = useState<Point2D[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const moduleRef = useRef<WaveEngineModule | null>(null)

  // Load wasm module
  useEffect(() => {
    const loadWasm = async () => {
      try {
        // Load the Wasm module using the Emscripten-generated loader
        const script = document.createElement('script')
        script.src = '/engine.js'
        script.async = true
        script.onload = () => {
          // Wait for the module to initialize
          if (window.Module) {
            const initModule = async () => {
              moduleRef.current = window.Module as WaveEngineModule
              // Create a new WaveEngine instance
              const newEngine = new moduleRef.current.WaveEngine(-500, 500, 800)
              setEngine(newEngine)
              setLoading(false)
            }

            if (window.Module.onRuntimeInitialized) {
              window.Module.onRuntimeInitialized = initModule
            } else {
              initModule()
            }
          }
        }
        script.onerror = () => {
          setError('Failed to load Wasm module')
          setLoading(false)
        }
        document.body.appendChild(script)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error loading Wasm')
        setLoading(false)
      }
    }

    loadWasm()

    return () => {
      if (engine) {
        engine.delete()
      }
    }
  }, [])

  const generateSine = useCallback(
    (amplitude: number, frequency: number) => {
      if (!engine) return
      try {
        engine.generateSine(amplitude, frequency)
        const newPoints = engine.getPoints()
        setPoints(newPoints)
      } catch (err) {
        setError('Error generating sine wave')
      }
    },
    [engine]
  )

  const generateCosine = useCallback(
    (amplitude: number, frequency: number) => {
      if (!engine) return
      try {
        engine.generateCosine(amplitude, frequency)
        const newPoints = engine.getPoints()
        setPoints(newPoints)
      } catch (err) {
        setError('Error generating cosine wave')
      }
    },
    [engine]
  )

  return {
    engine,
    points,
    loading,
    error,
    generateSine,
    generateCosine,
  }
}
