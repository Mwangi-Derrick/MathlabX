# MathlabX Engine Architecture

This document provides a high-level overview of the MathlabX architecture, mapping the High-Performance C++ kernel (WASM) to the React TypeScript frontend hooks.

## Spatial Field Engine Hierarchy (2D / 3D Vector Calculus)

This hierarchy handles the spatial computations (Divergence, Curl, Gradient) and traces streamlines or verifies theorems. The engines utilize a dual-path execution strategy (SIMD for supported hardware, standard OOP for scalar fallbacks).

```mermaid
classDiagram
    class SpatialFieldEngine {
        <<Abstract>>
        -int resX, resY, resZ
        -double xMin, xMax, yMin, yMax, zMin, zMax
        +setResolution(rx, ry, rz)
        +setBounds(xmin, xmax, ...)
        #recomputeSteps()
    }
    
    class SpatialFieldEngine2D {
        -std::vector~GridPoint2D~ grid
        -double ampX, ampY
        -std::string preset
        +setPreset(name)
        +setCustomParams(ax, ay, fx, fy)
        +generateGrid()
        +evaluateField(x, y, &fx, &fy)
    }

    class SpatialFieldEngine3D {
        -std::vector~GridPoint3D~ grid
        -double ampX, ampY, ampZ
        +generateGrid()
        +evaluateField3D(x, y, z, &fx, &fy, &fz)
    }

    SpatialFieldEngine <|-- SpatialFieldEngine2D
    SpatialFieldEngine <|-- SpatialFieldEngine3D

    class DivergenceEngine2D {
        +compute()
        +computeDivergence()
    }
    class CurlEngine2D {
        +compute()
        +computeCurl()
    }
    class GradientEngine2D {
        +compute()
        +computeGradient()
    }
    class StreamlineTracer {
        +traceGrid(densityX, densityY)
        +traceFromSeed(seedX, seedY)
    }
    class TheoremEngine {
        +verifyGreensTheorem(x0, y0, x1, y1)
    }

    SpatialFieldEngine2D <|-- DivergenceEngine2D
    SpatialFieldEngine2D <|-- CurlEngine2D
    SpatialFieldEngine2D <|-- GradientEngine2D
    SpatialFieldEngine2D <|-- StreamlineTracer
    CurlEngine2D <|-- TheoremEngine
```

## AC Time-Domain Engine Hierarchy (Circuits & Phasors)

This hierarchy manages the mathematical waveforms for the AC Circuit analysis, evaluating time-based parameters over arrays of sequential data.

```mermaid
classDiagram
    class WaveEngine {
        -int numSamples
        -double timeStart, timeEnd
        -std::vector~double~ timeCache
        +setSamples(samples)
        +generateSineWave(amplitude, frequency, phase)
    }

    class ACCircuitEngine {
        -double resistance, inductance, capacitance
        -double sourceAmplitude, sourceFrequency
        -std::vector~Point2D~ voltagePoints
        -std::vector~Point2D~ currentPoints
        +setCircuitParameters(R, L, C)
        +getImpedance()
        +getPhaseAngle()
        +getPowerFactor()
        +getRealPower()
        +generateWaves()
    }

    class PhasorEngine {
        +getVSourcePhasor(t) Complex
        +getVRPhasor(t) Complex
        +getVLPhasor(t) Complex
        +getVCPhasor(t) Complex
    }

    class FrequencyResponseEngine {
        -std::vector~FrequencyPoint~ freqData
        +sweepFrequency(startHz, endHz, steps)
        +getResonantFrequency()
        +getBandwidth()
        +getQualityFactor()
    }

    WaveEngine <|-- ACCircuitEngine
    ACCircuitEngine <|-- PhasorEngine
    ACCircuitEngine <|-- FrequencyResponseEngine
```

## React Frontend Integration

The Emscripten bindings convert the above C++ classes to JavaScript classes. The React hooks then wrap these JS classes to provide reactive states to the UI.

```mermaid
flowchart TD
    subgraph "C++ WebAssembly Kernel"
        A[ACCircuitEngine.cpp]
        B[DivergenceEngine.cpp]
    end

    subgraph "Emscripten Bindings"
        C[mathlab_x.cpp]
    end

    subgraph "React Frontend"
        D[wasmLoader.ts]
        E[useACCircuit.ts]
        F[useVectorCalc.ts]
        G[VectorCalcPage.tsx]
        H[ACSignalsPage.tsx]
    end

    A --> |Compiles to| C
    B --> |Compiles to| C
    C --> |mathlab_x.wasm/mjs| D
    D --> |Instantiates| E
    D --> |Instantiates| F
    E --> |Provides state & playhead| H
    F --> |Provides 2D Grid state| G
```
