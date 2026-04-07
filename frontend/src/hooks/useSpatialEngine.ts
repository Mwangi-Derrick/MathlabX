import { useState, useEffect, useCallback, useRef } from 'react'
import type { 
  CurlEngine2DInstance, 
  CurlEngine3DInstance,
  GridPoint2D,
  GridPoint3D
} from '../lib/types'
import { createCurlEngine2D, createCurlEngine3D } from '../lib/wasmLoader'

export function useSpatialEngine2D(rx: number, ry: number) {
  const [loading, setLoading] = useState(true)
  const [grid, setGrid] = useState<GridPoint2D[]>([])
  const engineRef = useRef<CurlEngine2DInstance | null>(null)

  useEffect(() => {
    let mounted = true
    createCurlEngine2D(rx, ry, -5, 5, -5, 5).then(engine => {
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

  const compute = useCallback((preset: string, ax: number, ay: number, fx: number, fy: number) => {
    const engine = engineRef.current
    if (!engine) return
    engine.setPreset(preset)
    engine.setCustomParams(ax, ay, fx, fy)
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

export function useSpatialEngine3D(rx: number, ry: number, rz: number) {
  const [loading, setLoading] = useState(true)
  const [grid, setGrid] = useState<GridPoint3D[]>([])
  const engineRef = useRef<CurlEngine3DInstance | null>(null)

  useEffect(() => {
    let mounted = true
    createCurlEngine3D(rx, ry, rz, -5, 5, -5, 5, -5, 5).then(engine => {
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
  }, [rx, ry, rz])

  const compute = useCallback((preset: string, ax: number, ay: number, az: number, fx: number, fy: number, fz: number) => {
    const engine = engineRef.current
    if (!engine) return
    engine.setPreset(preset)
    engine.setCustomParams(ax, ay, az, fx, fy, fz)
    engine.compute()
    
    const wasmGrid = engine.getGrid()
    const result: GridPoint3D[] = []
    for (let i = 0; i < wasmGrid.size(); i++) {
      result.push(wasmGrid.get(i))
    }
    wasmGrid.delete()
    setGrid(result)
  }, [])

  return { loading, grid, compute }
}
