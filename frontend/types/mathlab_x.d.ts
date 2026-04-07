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
 */
export interface Point2DVector {
  size(): number
  get(index: number): Point2D
  delete(): void
}

/** A spatial 2D grid point — maps to C++ GridPoint2D struct */
export interface GridPoint2D {
  x: number
  y: number
  fx: number
  fy: number
  divergence: number
  curl_z: number
}

/** A spatial 3D grid point — maps to C++ GridPoint3D struct */
export interface GridPoint3D {
  x: number
  y: number
  z: number
  fx: number
  fy: number
  fz: number
  divergence: number
  curl_x: number
  curl_y: number
  curl_z: number
}

/** Emscripten vector wrapper for std::vector<GridPoint2D> */
export interface GridPoint2DVector {
  size(): number
  get(index: number): GridPoint2D
  delete(): void
}

/** Emscripten vector wrapper for std::vector<GridPoint3D> */
export interface GridPoint3DVector {
  size(): number
  get(index: number): GridPoint3D
  delete(): void
}

/**
 * Instance of the C++ WaveEngine class.
 * Created via `new module.WaveEngine(start, end, samples)`.
 */
export interface WaveEngineInstance {
  setSamples(numSamples: number): void
  getSamples(): number
  delete(): void
}

/**
 * Instance of the C++ ACCircuitEngine class.
 * Inherits from WaveEngine.
 */
export interface ACCircuitEngineInstance extends WaveEngineInstance {
  setCircuitParameters(resistance: number, inductance: number, capacitance: number): void
  setSource(amplitude: number, freq: number): void
  getOmega(): number
  getInductiveReactance(): number
  getCapacitiveReactance(): number
  getImpedance(): number
  getPhaseAngle(): number
  getCurrentAmplitude(): number
  getPowerFactor(): number
  getRealPower(): number
  getReactivePower(): number
  getApparentPower(): number
  generateWaves(): void
  getVoltagePoints(): Point2DVector
  getCurrentPoints(): Point2DVector
}

/** Instance of SpatialFieldEngine2D */
export interface SpatialFieldEngine2DInstance {
  setPreset(name: string): void
  setCustomParams(ax: number, ay: number, fx: number, fy: number): void
  generateGrid(): void
  getGrid(): GridPoint2DVector
  getResX(): number
  getResY(): number
  setResolution(rx: number, ry: number): void
  setBounds(xmin: number, xmax: number, ymin: number, ymax: number): void
  delete(): void
}

/** Instance of DivergenceEngine2D */
export interface DivergenceEngine2DInstance extends SpatialFieldEngine2DInstance {
  compute(): void
  computeDivergence(): void
}

/** Instance of CurlEngine2D */
export interface CurlEngine2DInstance extends SpatialFieldEngine2DInstance {
  compute(): void
  computeCurl(): void
}

/** Instance of SpatialFieldEngine3D */
export interface SpatialFieldEngine3DInstance {
  setPreset(name: string): void
  setCustomParams(ax: number, ay: number, az: number, fx: number, fy: number, fz: number): void
  generateGrid(): void
  getGrid(): GridPoint3DVector
  getResX(): number
  getResY(): number
  getResZ(): number
  setResolution(rx: number, ry: number, rz: number): void
  setBounds(xmin: number, xmax: number, ymin: number, ymax: number, zmin: number, zmax: number): void
  delete(): void
}

/** Instance of DivergenceEngine3D */
export interface DivergenceEngine3DInstance extends SpatialFieldEngine3DInstance {
  compute(): void
  computeDivergence(): void
}

/** Instance of CurlEngine3D */
export interface CurlEngine3DInstance extends SpatialFieldEngine3DInstance {
  compute(): void
  computeCurl(): void
}

/**
 * The fully-initialized Emscripten module with our bound classes.
 */
export interface WaveEngineModule {
  WaveEngine: new (start: number, end: number, samples: number) => WaveEngineInstance
  ACCircuitEngine: new (start: number, end: number, samples: number) => ACCircuitEngineInstance
  SpatialFieldEngine2D: new (rx: number, ry: number, xmin: number, xmax: number, ymin: number, ymax: number) => SpatialFieldEngine2DInstance
  DivergenceEngine2D: new (rx: number, ry: number, xmin: number, xmax: number, ymin: number, ymax: number) => DivergenceEngine2DInstance
  CurlEngine2D: new (rx: number, ry: number, xmin: number, xmax: number, ymin: number, ymax: number) => CurlEngine2DInstance
  SpatialFieldEngine3D: new (rx: number, ry: number, rz: number, xmin: number, xmax: number, ymin: number, ymax: number, zmin: number, zmax: number) => SpatialFieldEngine3DInstance
  DivergenceEngine3D: new (rx: number, ry: number, rz: number, xmin: number, xmax: number, ymin: number, ymax: number, zmin: number, zmax: number) => DivergenceEngine3DInstance
  CurlEngine3D: new (rx: number, ry: number, rz: number, xmin: number, xmax: number, ymin: number, ymax: number, zmin: number, zmax: number) => CurlEngine3DInstance
}

/**
 * Factory function exported by engine.mjs
 */
declare function createModule(config?: {
  locateFile?: (path: string, prefix: string) => string
}): Promise<WaveEngineModule>

export default createModule
