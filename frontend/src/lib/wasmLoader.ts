import type { WaveEngineModule } from './types'

declare global {
  interface Window {
    Module?: any
  }
}

let modulePromise: Promise<WaveEngineModule> | null = null

export const loadWasmModule = (): Promise<WaveEngineModule> => {
  // Return cached promise if already loading/loaded
  if (modulePromise) {
    console.log('[WASM] Returning cached module promise')
    return modulePromise
  }

  modulePromise = new Promise<WaveEngineModule>((resolve, reject) => {
    console.log('[WASM] Starting module load...')

    // Check if already loaded in window
    if (window.Module && window.Module.WaveEngine) {
      console.log('[WASM] ✓ Module already in window.Module')
      resolve(window.Module as WaveEngineModule)
      return
    }

    // Set up Emscripten module object BEFORE loading script
    window.Module = window.Module || {}
    window.Module.onRuntimeInitialized = () => {
      console.log('[WASM] ✓ Runtime initialized')
      if (window.Module && window.Module.WaveEngine) {
        console.log('[WASM] ✓ WaveEngine class available')
        resolve(window.Module as WaveEngineModule)
      } else {
        console.error('[WASM] ✗ WaveEngine class not found after initialization')
        reject(new Error('WaveEngine class not found in Module'))
      }
    }

    // Load the Wasm module script
    console.log('[WASM] Loading engine.js...')
    const script = document.createElement('script')
    script.src = '/engine.js'
    script.type = 'text/javascript'
    script.crossOrigin = 'anonymous'

    script.onload = () => {
      console.log('[WASM] ✓ engine.js script loaded')
    }

    script.onerror = (event) => {
      console.error('[WASM] ✗ Failed to load engine.js', event)
      reject(new Error(`Failed to load engine.js: ${event}`))
    }

    // Set timeout in case onRuntimeInitialized never fires
    const timeout = setTimeout(() => {
      console.error('[WASM] ✗ Timeout waiting for runtime initialization')
      reject(new Error('Wasm runtime initialization timeout'))
    }, 10000)

    // Store original callback
    const origCallback = window.Module.onRuntimeInitialized
    window.Module.onRuntimeInitialized = () => {
      clearTimeout(timeout)
      console.log('[WASM] ✓ Timeout cleared, runtime initialized')
      if (typeof origCallback === 'function') {
        origCallback()
      }
      if (window.Module && window.Module.WaveEngine) {
        console.log('[WASM] ✓ WaveEngine ready')
        resolve(window.Module as WaveEngineModule)
      } else {
        console.error('[WASM] ✗ WaveEngine not available')
        reject(new Error('WaveEngine not available'))
      }
    }

    // Append script to document
    document.head.appendChild(script)
    console.log('[WASM] Script tag appended to head')
  })

  return modulePromise
}

export const createWaveEngine = async (
  domainStart: number = -500,
  domainEnd: number = 500,
  samples: number = 800
) => {
  console.log('[WaveEngine] Creating engine...')
  const module = await loadWasmModule()
  console.log('[WaveEngine] Module loaded, instantiating WaveEngine')
  
  try {
    const engine = new module.WaveEngine(domainStart, domainEnd, samples)
    console.log('[WaveEngine] ✓ Engine instance created', engine)
    return engine
  } catch (error) {
    console.error('[WaveEngine] ✗ Failed to create engine:', error)
    throw error
  }
}
