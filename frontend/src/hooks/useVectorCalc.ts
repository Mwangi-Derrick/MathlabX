import { useState, useEffect, useCallback, useRef } from 'react'
import type { 
  DivergenceEngine2DInstance,
  CurlEngine2DInstance,
  GradientEngine2DInstance,
  GridPoint2D
} from '../lib/types'
import { createDivergenceEngine2D, createCurlEngine2D, createGradientEngine2D } from '../lib/wasmLoader'

export function useVectorCalc2D(rx: number, ry: number) {
  const [loading, setLoading] = useState(true)
  const [grid, setGrid] = useState<GridPoint2D[]>([])
  
  const divRef = useRef<DivergenceEngine2DInstance | null>(null)
  const curlRef = useRef<CurlEngine2DInstance | null>(null)
  const gradRef = useRef<GradientEngine2DInstance | null>(null)
  const initDone = useRef(false)

  // Initial mount
  useEffect(() => {
    let mounted = true
    const init = async () => {
      const d = await createDivergenceEngine2D(rx, ry, -5, 5, -5, 5)
      const c = await createCurlEngine2D(rx, ry, -5, 5, -5, 5)
      const g = await createGradientEngine2D(rx, ry, -5, 5, -5, 5)
      
      if (!mounted) {
        d.delete(); c.delete(); g.delete();
        return
      }
      divRef.current = d
      curlRef.current = c
      gradRef.current = g
      initDone.current = true
      setLoading(false)
    }
    init()
    return () => {
      mounted = false
      divRef.current?.delete()
      curlRef.current?.delete()
      gradRef.current?.delete()
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
      if (cancelled) {
        d.delete(); c.delete(); g.delete();
        return
      }
      divRef.current?.delete()
      curlRef.current?.delete()
      gradRef.current?.delete()
      divRef.current = d
      curlRef.current = c
      gradRef.current = g
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
  }, [])

  return { loading, grid, compute }
}
