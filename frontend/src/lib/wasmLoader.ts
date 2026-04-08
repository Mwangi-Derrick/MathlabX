/**
 * WASM Module Loader
 * 
 * Loads and initializes the Emscripten-compiled C++ engines.
 */

import type { 
  WaveEngineModule, 
  WaveEngineInstance,
  ACCircuitEngineInstance,
  DivergenceEngine2DInstance,
  CurlEngine2DInstance,
  GradientEngine2DInstance,
  DivergenceEngine3DInstance,
  CurlEngine3DInstance,
  PhasorEngineInstance,
  FrequencyResponseEngineInstance,
  StreamlineTracerInstance,
  TheoremEngineInstance
} from './types'

// @ts-ignore — Emscripten-generated file, no TS source
import createModule from '../../../wasm/mathlab_x.mjs'

let modulePromise: Promise<WaveEngineModule> | null = null

/**
 * Load and initialize the WASM module.
 */
export function loadWasmModule(): Promise<WaveEngineModule> {
  if (modulePromise) {
    return modulePromise
  }

  console.log('[WASM] Initializing module...')
  modulePromise = createModule({
    locateFile: (path: string) => {
      if (path.endsWith('.wasm')) {
        return new URL('../../../wasm/mathlab_x.wasm', import.meta.url).href
      }
      return path
    }
  }).then((module: WaveEngineModule) => {
    if (!module || typeof module.WaveEngine !== 'function') {
      throw new Error('WASM module loaded but WaveEngine class not found.')
    }
    console.log('[WASM] ✓ Module initialized')
    return module
  }).catch((err: unknown) => {
    modulePromise = null
    throw err
  })

  if (!modulePromise) {
    throw new Error('WASM module loading state lost.')
  }
  return modulePromise
}

/** Factory for WaveEngine */
export async function createWaveEngine(
  start: number, end: number, samples: number
): Promise<WaveEngineInstance> {
  const module = await loadWasmModule()
  return new module.WaveEngine(start, end, samples)
}

/** Factory for ACCircuitEngine */
export async function createACCircuitEngine(
  start: number, end: number, samples: number
): Promise<ACCircuitEngineInstance> {
  const module = await loadWasmModule()
  return new module.ACCircuitEngine(start, end, samples)
}

/** Factory for PhasorEngine */
export async function createPhasorEngine(
  start: number, end: number, samples: number
): Promise<PhasorEngineInstance> {
  const module = await loadWasmModule()
  return new module.PhasorEngine(start, end, samples)
}

/** Factory for DivergenceEngine2D */
export async function createDivergenceEngine2D(
  rx: number, ry: number, xmin: number, xmax: number, ymin: number, ymax: number
): Promise<DivergenceEngine2DInstance> {
  const module = await loadWasmModule()
  return new module.DivergenceEngine2D(rx, ry, xmin, xmax, ymin, ymax)
}

/** Factory for CurlEngine2D */
export async function createCurlEngine2D(
  rx: number, ry: number, xmin: number, xmax: number, ymin: number, ymax: number
): Promise<CurlEngine2DInstance> {
  const module = await loadWasmModule()
  return new module.CurlEngine2D(rx, ry, xmin, xmax, ymin, ymax)
}

/** Factory for GradientEngine2D */
export async function createGradientEngine2D(
  rx: number, ry: number, xmin: number, xmax: number, ymin: number, ymax: number
): Promise<GradientEngine2DInstance> {
  const module = await loadWasmModule()
  return new module.GradientEngine2D(rx, ry, xmin, xmax, ymin, ymax)
}


/** Factory for DivergenceEngine3D */
export async function createDivergenceEngine3D(
  rx: number, ry: number, rz: number, xmin: number, xmax: number, ymin: number, ymax: number, zmin: number, zmax: number
): Promise<DivergenceEngine3DInstance> {
  const module = await loadWasmModule()
  return new module.DivergenceEngine3D(rx, ry, rz, xmin, xmax, ymin, ymax, zmin, zmax)
}

/** Factory for CurlEngine3D */
export async function createCurlEngine3D(
  rx: number, ry: number, rz: number, xmin: number, xmax: number, ymin: number, ymax: number, zmin: number, zmax: number
): Promise<CurlEngine3DInstance> {
  const module = await loadWasmModule()
  return new module.CurlEngine3D(rx, ry, rz, xmin, xmax, ymin, ymax, zmin, zmax)
}

/** Factory for FrequencyResponseEngine */
export async function createFrequencyResponseEngine(
  samples: number, start: number, end: number
): Promise<FrequencyResponseEngineInstance> {
  const module = await loadWasmModule()
  return new module.FrequencyResponseEngine(samples, start, end)
}

/** Factory for StreamlineTracer */
export async function createStreamlineTracer(
  rx: number, ry: number, xmin: number, xmax: number, ymin: number, ymax: number
): Promise<StreamlineTracerInstance> {
  const module = await loadWasmModule()
  return new module.StreamlineTracer(rx, ry, xmin, xmax, ymin, ymax)
}

/** Factory for TheoremEngine */
export async function createTheoremEngine(
  rx: number, ry: number, xmin: number, xmax: number, ymin: number, ymax: number
): Promise<TheoremEngineInstance> {
  const module = await loadWasmModule()
  return new module.TheoremEngine(rx, ry, xmin, xmax, ymin, ymax)
}
