/**
 * TypeScript declarations for the Emscripten-generated WASM module.
 * 
 * The engine is compiled with MODULARIZE=1 + EXPORT_ES6=1, so it exports
 * a factory function that returns a Promise<WaveEngineModule>.
 * 
 * This declaration file tells TypeScript what types are available
 * on the instantiated module.
 */

/** A 2D point returned by the engine — maps to C++ Point2D struct */
export interface Point2D {
  x: number
  y: number
}

/**
 * Emscripten vector wrapper for std::vector<Point2D>.
 * NOT a regular JS array — use .size() and .get(i) to access elements.
 * Must call .delete() when done to free C++ memory.
 */
export interface Point2DVector {
  size(): number
  get(index: number): Point2D
  delete(): void
}

/**
 * Instance of the C++ WaveEngine class.
 * Created via `new module.WaveEngine(start, end, samples)`.
 * 
 * IMPORTANT: Call .delete() when done to free C++ heap memory.
 * Failure to do so leaks memory on the WASM heap.
 */
export interface WaveEngineInstance {
  /** Generate sine wave: V(t) = amplitude * sin(frequency * t + phase) */
  generateSine(amplitude: number, frequency: number, phase: number): void
  
  /** Generate cosine wave: V(t) = amplitude * cos(frequency * t + phase) */
  generateCosine(amplitude: number, frequency: number, phase: number): void
  
  /** Get the computed waveform data. Returns an Emscripten vector, not a JS array. */
  getPoints(): Point2DVector
  
  /** Update the number of sample points (clamped to [10, 10000] in C++) */
  setSamples(numSamples: number): void
  
  /** Get current sample count */
  getSamples(): number
  
  /** Get the number of computed points (after generate* call) */
  getPointCount(): number
  
  /** Free the C++ object. MUST be called to prevent WASM heap leaks. */
  delete(): void
}

/**
 * The fully-initialized Emscripten module with our bound classes.
 * This is what the factory function resolves to.
 */
export interface WaveEngineModule {
  WaveEngine: new (start: number, end: number, samples: number) => WaveEngineInstance
}

/**
 * Factory function exported by engine.mjs (Emscripten MODULARIZE=1).
 * Call this to initialize the WASM module.
 * 
 * @param config - Optional Emscripten module configuration
 * @returns Promise that resolves when the WASM binary is loaded and ready
 */
declare function createModule(config?: {
  locateFile?: (path: string, prefix: string) => string
}): Promise<WaveEngineModule>

export default createModule
