/**
 * Type definitions for MathlabX frontend.
 * 
 * These mirror the C++ types exposed via Emscripten Embind.
 * The canonical type definitions are in frontend/types/mathlab_x.d.ts.
 */

export type { 
  Point2D, 
  Point2DVector, 
  Complex,
  GridPoint2D,
  GridPoint3D,
  GridPoint2DVector,
  GridPoint3DVector,
  WaveEngineInstance, 
  ACCircuitEngineInstance,
  PhasorEngineInstance,
  SpatialFieldEngine2DInstance,
  DivergenceEngine2DInstance,
  CurlEngine2DInstance,
  GradientEngine2DInstance,
  SpatialFieldEngine3DInstance,
  DivergenceEngine3DInstance,
  CurlEngine3DInstance,
  WaveEngineModule 
} from '../../types/mathlab_x.d.ts'
