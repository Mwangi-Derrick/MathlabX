import { useState, useCallback, useRef, useEffect } from 'react'
import type { 
  StreamlineTracerInstance, 
  Point2D, 
  Point2DVectorVector 
} from '../lib/types'
import { createStreamlineTracer } from '../lib/wasmLoader'

/**
 * useStreamlineTracer — React hook for field line tracing (EMAG 1)
 */
export function useStreamlineTracer(rx: number, ry: number) {
  const [loading, setLoading] = useState(true)
  const engineRef = useRef<StreamlineTracerInstance | null>(null)
  const [streamlines, setStreamlines] = useState<Point2D[][]>([])

  useEffect(() => {
    let mounted = true
    createStreamlineTracer(rx, ry, -5, 5, -5, 5).then(engine => {
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
  }, [rx, ry])

  const traceGrid = useCallback((numSeeds: number = 25, stepSize: number = 0.05, maxSteps: number = 500) => {
    const engine = engineRef.current
    if (!engine) return []

    const wasmLines: Point2DVectorVector = engine.traceGrid(numSeeds, stepSize, maxSteps)
    const result: Point2D[][] = []

    for (let i = 0; i < wasmLines.size(); i++) {
        const line: Point2D[] = []
        const wasmLine = wasmLines.get(i)
        for (let j = 0; j < wasmLine.size(); j++) {
            line.push(wasmLine.get(j))
        }
        result.push(line)
        wasmLine.delete()
    }

    wasmLines.delete()
    setStreamlines(result)
    return result
  }, [])

  return { loading, streamlines, traceGrid }
}
