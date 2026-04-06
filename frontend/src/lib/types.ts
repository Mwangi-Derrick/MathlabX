/**
 * Type definitions for MathlabX frontend.
 * 
 * These mirror the C++ types exposed via Emscripten Embind.
 * The canonical type definitions are in src/wasm/engine.d.ts — 
 * this file re-exports them for convenience.
 */

export type { 
  Point2D, 
  Point2DVector, 
  WaveEngineInstance, 
  WaveEngineModule 
} from '../../../wasm/engine.d'
