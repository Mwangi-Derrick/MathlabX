/**
 * WASM Module Loader
 * 
 * Loads and initializes the Emscripten-compiled C++ wave engine.
 * 
 * Architecture:
 *   1. engine.cpp is compiled with MODULARIZE=1 + EXPORT_ES6=1
 *   2. This produces engine.mjs (factory function) + engine.wasm (binary)
 *   3. We import the factory, call it with locateFile config, and get back
 *      a Promise<WaveEngineModule> containing our bound C++ classes
 * 
 * The factory-function approach (MODULARIZE) is the correct Emscripten pattern.
 * It avoids polluting window.Module and works cleanly with Vite's module system.
 */

import type { WaveEngineModule, WaveEngineInstance } from '../../../wasm/engine.d'
// @ts-ignore — Emscripten-generated file, no TS source
import createModule from '../../../wasm/engine.mjs'

// ─── Module Singleton ────────────────────────────────────────────────────────
// Cache the module promise so we only initialize WASM once,
// even if multiple components call loadWasmModule() concurrently.

let modulePromise: Promise<WaveEngineModule> | null = null

/**
 * Load and initialize the WASM module.
 * Returns a cached promise on subsequent calls — WASM is only loaded once.
 * 
 * The locateFile callback tells Emscripten where to find the .wasm binary.
 * import.meta.url resolves relative to THIS file's location, so Vite
 * can correctly resolve the path in both dev and production builds.
 */
export function loadWasmModule(): Promise<WaveEngineModule> {
  if (modulePromise) {
    return modulePromise
  }

  console.log('[WASM] Initializing module...')
  const wasm_engine_path = new URL('../../../wasm/engine.mjs', import.meta.url).href
  console.log(`[WASM] Loading from ${wasm_engine_path}`)
  modulePromise = createModule({
    // Emscripten calls locateFile() to find the .wasm binary.
    // We use import.meta.url so the path resolves correctly whether
    // we're running in Vite dev server or a production build.
    locateFile: (path: string) => {
      if (path.endsWith('.wasm')) {
        return new URL('../wasm/engine.wasm', import.meta.url).href
      }
      return path
    }
  }).then((module) => {
    // Validate that the expected bindings exist
    if (!module || typeof module.WaveEngine !== 'function') {
      throw new Error(
        'WASM module loaded but WaveEngine class not found. ' +
        'Check that engine.cpp has EMSCRIPTEN_BINDINGS and was compiled with --bind.'
      )
    }
    console.log('[WASM] ✓ Module initialized — WaveEngine class available')
    return module
  }).catch((err) => {
    // Reset the cached promise so a retry is possible
    modulePromise = null
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[WASM] ✗ Failed to initialize:', msg)
    throw err
  })

  return modulePromise
}

/**
 * Create a new WaveEngine instance.
 * 
 * @param domainStart  Left boundary of the x-axis (default -500)
 * @param domainEnd    Right boundary of the x-axis (default 500)
 * @param samples      Number of sample points to compute (default 800)
 * @returns A WaveEngine instance — CALLER MUST call .delete() when done
 */
export async function createWaveEngine(
  domainStart: number = -500,
  domainEnd: number = 500,
  samples: number = 800
): Promise<WaveEngineInstance> {
  const module = await loadWasmModule()

  const engine = new module.WaveEngine(domainStart, domainEnd, samples)
  console.log(`[WASM] ✓ WaveEngine created (domain: [${domainStart}, ${domainEnd}], samples: ${samples})`)

  return engine
}
