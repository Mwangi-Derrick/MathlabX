import { useState, useCallback, useRef, useEffect } from 'react'
import type { 
  TheoremEngineInstance, 
  // TheoremResult 
} from '../lib/types'
import { createTheoremEngine } from '../lib/wasmLoader'

/**
 * useTheoremEngine — React hook for Theorem Verification (Vector Calc 1)
 */
export function useTheoremEngine(rx: number, ry: number) {
  const [loading, setLoading] = useState(true)
  const engineRef = useRef<TheoremEngineInstance | null>(null)

  useEffect(() => {
    let mounted = true
    createTheoremEngine(rx, ry, -5, 5, -5, 5).then(engine => {
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

  const verifyGreensTheorem = useCallback((x0: number, y0: number, x1: number, y1: number, preset: string, ax: number, ay: number, fx: number, fy: number) => {
    const engine = engineRef.current
    if (!engine) return null

    engine.setPreset(preset)
    engine.setCustomParams(ax, ay, fx, fy)
    // Area integral needs updated grid and curl
    engine.compute() 
    
    return engine.verifyGreensTheorem(x0, y0, x1, y1)
  }, [])

  return { loading, verifyGreensTheorem }
}
