import { useState, useEffect, useCallback, useRef } from 'react'
import type { 
  DivergenceEngine2DInstance,
  CurlEngine2DInstance,
  GradientEngine2DInstance,
  StreamlineTracerInstance,
  TheoremEngineInstance,
  GridPoint2D,
  Point2D,
  TheoremResult
} from '../lib/types'
import { createDivergenceEngine2D, createCurlEngine2D, createGradientEngine2D, createStreamlineTracer, createTheoremEngine } from '../lib/wasmLoader'

export function useVectorCalc2D(rx: number, ry: number) {
  const [loading, setLoading] = useState(true)
  const [grid, setGrid] = useState<GridPoint2D[]>([])
  const [streamlines, setStreamlines] = useState<Point2D[][]>([])
  const [theoremResult, setTheoremResult] = useState<TheoremResult | null>(null)
  
  const divRef = useRef<DivergenceEngine2DInstance | null>(null)
  const curlRef = useRef<CurlEngine2DInstance | null>(null)
  const gradRef = useRef<GradientEngine2DInstance | null>(null)
  const streamRef = useRef<StreamlineTracerInstance | null>(null)
  const theoremRef = useRef<TheoremEngineInstance | null>(null)
  const initDone = useRef(false)

  // Initial mount
  useEffect(() => {
    let mounted = true
    const init = async () => {
      const d = await createDivergenceEngine2D(rx, ry, -5, 5, -5, 5)
      const c = await createCurlEngine2D(rx, ry, -5, 5, -5, 5)
      const g = await createGradientEngine2D(rx, ry, -5, 5, -5, 5)
      const s = await createStreamlineTracer(rx, ry, -5, 5, -5, 5)
      const t = await createTheoremEngine(rx, ry, -5, 5, -5, 5)
      
      if (!mounted) {
        d.delete(); c.delete(); g.delete(); s.delete(); t.delete();
        return
      }
      divRef.current = d
      curlRef.current = c
      gradRef.current = g
      streamRef.current = s
      theoremRef.current = t
      initDone.current = true
      setLoading(false)
    }
    init()
    return () => {
      mounted = false
      divRef.current?.delete()
      curlRef.current?.delete()
      gradRef.current?.delete()
      streamRef.current?.delete()
      theoremRef.current?.delete()
    }
  }, [])

  // Hot-swap on resolution change (no loading flash)
  useEffect(() => {
    if (!initDone.current) return
    let cancelled = false
    const swap = async () => {
      const d = await createDivergenceEngine2D(rx, ry, -5, 5, -5, 5)
      const c = await createCurlEngine2D(rx, ry, -5, 5, -5, 5)
      const g = await createGradientEngine2D(rx, ry, -5, 5, -5, 5)
      const s = await createStreamlineTracer(rx, ry, -5, 5, -5, 5)
      const t = await createTheoremEngine(rx, ry, -5, 5, -5, 5)
      if (cancelled) {
        d.delete(); c.delete(); g.delete(); s.delete(); t.delete();
        return
      }
      divRef.current?.delete()
      curlRef.current?.delete()
      gradRef.current?.delete()
      streamRef.current?.delete()
      theoremRef.current?.delete()
      divRef.current = d
      curlRef.current = c
      gradRef.current = g
      streamRef.current = s
      theoremRef.current = t
    }
    swap()
    return () => { cancelled = true }
  }, [rx, ry])

  const compute = useCallback((type: 'div' | 'curl' | 'grad', preset: string, ax: number, ay: number) => {
    let engine: any = null
    if (type === 'div') engine = divRef.current
    else if (type === 'curl') engine = curlRef.current
    else if (type === 'grad') engine = gradRef.current
    
    if (!engine) return

    if (preset === 'custom') {
      engine.setCustomParams(ax, ay, 1.0, 1.0)
    } else {
      engine.setAmplitude(ax, ay)
      // engine.setFrequency(fx, fy)
      engine.setPreset(preset)
    }
    engine.compute()
    
    const wasmGrid = engine.getGrid()
    const result: GridPoint2D[] = []
    for (let i = 0; i < wasmGrid.size(); i++) {
      result.push(wasmGrid.get(i))
    }
    wasmGrid.delete()
    setGrid(result)
    // Clear out advanced visualizations on compute to keep it clean
    setTheoremResult(null)
  }, [])

  const computeStreamlines = useCallback((preset: string, ax: number, ay: number, traces: number = 8) => {
    const engine = streamRef.current
    if (!engine) return
    if (preset === 'custom') engine.setCustomParams(ax, ay, 1.0, 1.0)
    else { engine.setAmplitude(ax, ay); engine.setPreset(preset) }

    const vecVec = engine.traceGrid(traces, 0.1, 150)
    const result: Point2D[][] = []
    for (let i = 0; i < vecVec.size(); i++) {
      const v = vecVec.get(i)
      const line: Point2D[] = []
      for (let j = 0; j < v.size(); j++) {
        const point = v.get(j)
        line.push({ x: point.x, y: point.y })
      }
      result.push(line)
      v.delete()
    }
    vecVec.delete()
    setStreamlines(result)
  }, [])

  const clearStreamlines = useCallback(() => setStreamlines([]), [])

  const verifyTheorem = useCallback((x0: number, y0: number, x1: number, y1: number, preset: string, ax: number, ay: number) => {
    const engine = theoremRef.current
    if (!engine) return
    if (preset === 'custom') engine.setCustomParams(ax, ay, 1.0, 1.0)
    else { engine.setAmplitude(ax, ay); engine.setPreset(preset) }
    
    // Convert x0,y0,x1,y1 to min/max since the selection might be drawn backwards
    const minX = Math.min(x0, x1)
    const maxX = Math.max(x0, x1)
    const minY = Math.min(y0, y1)
    const maxY = Math.max(y0, y1)

    // Using theoremEngine
    const res = engine.verifyGreensTheorem(minX, minY, maxX, maxY)
    setTheoremResult({
      lineIntegral: res.lineIntegral,
      areaIntegral: res.areaIntegral,
      matches: res.matches
    })
  }, [])

  return { loading, grid, compute, streamlines, computeStreamlines, clearStreamlines, theoremResult, verifyTheorem }
}
