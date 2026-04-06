// Wasm module types
export interface Point2D {
  x: number
  y: number
}

export interface WaveEngineModule {
  WaveEngine: new (start: number, end: number, samples: number) => WaveEngineInstance
  Point2DVector: Point2D[]
  _malloc: (size: number) => number
  _free: (ptr: number) => void
}

export interface WaveEngineInstance {
  generateSine(amplitude: number, frequency: number): void
  generateCosine(amplitude: number, frequency: number): void
  getPoints(): Point2D[]
  delete(): void
}

export interface WasmModule {
  onRuntimeInitialized?: () => void
  instantiateWasm?: (imports: any, successCallback: (module: any) => void) => undefined
}
