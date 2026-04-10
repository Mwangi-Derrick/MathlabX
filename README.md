# MathlabX ⚡

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-✓-654FF0.svg)](https://webassembly.org/)
[![CLI](https://img.shields.io/badge/Native%20CLI-Available-brightgreen.svg)](#-native-cli--logging)
[![SIMD](https://img.shields.io/badge/SIMD-Optimized-FF6B6B.svg)](docs/SIMD_DEEP_DIVE.md)
[![C++17](https://img.shields.io/badge/C++-17-00599C.svg)](https://isocpp.org/)

### AC, Phasor & Vector Field Simulator for EEE Students

> **A WebAssembly-powered simulation engine** that visualizes Electromagnetic fields, AC signals, phasor diagrams, and vector calculus — compiled from C++ and running directly in your browser.

MathLabX bridges the gap between theoretical **Electromagnetics**, **Vector Calculus**, and interactive software. By compiling a C++ numerical kernel to **WebAssembly (Wasm)**, MathLabX lets students and engineers visualize fields and AC signals in real-time — with zero installation.

> 📝 **Note on Hardware Optimization**: SIMD acceleration support and hardware mapping are currently being explored for the numerical kernel. See [`docs/SIMD_DEEP_DIVE.md`](docs/SIMD_DEEP_DIVE.md) for architectural notes.

---

## 🏗️ Core Architecture

MathLabX strictly separates heavy mathematical computation (C++) from the UI rendering layer (React).

### 1. Numerical Kernel (C++)

The engine is structured around two parallel class hierarchies — one for **time-domain** analysis and one for **spatial field** computation. All mathematical computations are performed in C++ for maximum precision and performance.

> 📝 **Deep Dive**: For a detailed mapping of EEE formulas to the C++ source code, see [**docs/MATH_KERNEL_DEEP_DIVE.md**](docs/MATH_KERNEL_DEEP_DIVE.md).

#### Time-Domain Engine (`cpp-engine/time_domain/`)
```
WaveEngine                         ← Base: discrete time-domain allocation
 └── ACCircuitEngine               ← RLC impedance, phase angle, V(t)/I(t) generation
      └── PhasorEngine             ← Complex phasor vectors (Vs, VR, VL, VC)
```

- **`WaveEngine`**: Base class managing sample count and time-domain buffer allocation.
- **`ACCircuitEngine`**: Computes RLC impedance ($Z$), phase angle ($\phi$), reactive power ($Q$), and generates discrete $V(t)$ and $I(t)$ waveform points.
- **`PhasorEngine`**: Extends `ACCircuitEngine` with complex phasor arithmetic — returns source, resistor, inductor, and capacitor voltage phasors as complex numbers for vector diagram rendering.

#### Spatial Field Engine (`cpp-engine/spatial/`)
```
SpatialFieldEngine                 ← Base: resolution, bounds, grid stepping
 ├── SpatialFieldEngine2D          ← 2D grid generation + field evaluation
 │    ├── DivergenceEngine2D       ← ∇·F (scalar divergence)
 │    ├── CurlEngine2D             ← ∇×F (curl, z-component)
 │    └── GradientEngine2D         ← ∇f  (gradient of scalar field)
 └── SpatialFieldEngine3D          ← 3D grid generation + field evaluation
      ├── DivergenceEngine3D       ← ∇·F (3D scalar divergence)
      └── CurlEngine3D             ← ∇×F (3D curl vector)
```

- **`SpatialFieldEngine`**: Abstract base managing resolution (`resX/Y/Z`), spatial bounds, and grid step sizes (`dx/dy/dz`). Exposes `setResolution()` and `setBounds()` for dynamic parameter updates.
- **`SpatialFieldEngine2D/3D`**: Generate contiguous `std::vector<GridPoint2D/3D>` grids with OpenMP-parallelized loops, evaluate configurable vector field presets (`swirl`, `radial`, `custom`), and expose the grid to JavaScript via Embind.
- **`DivergenceEngine`**: Computes $\nabla \cdot \mathbf{F}$ using central finite differences.
- **`CurlEngine`**: Computes $\nabla \times \mathbf{F}$ using central finite differences.
- **`GradientEngine`**: Computes $\nabla f$ — converts scalar potential to vector field (e.g., voltage → electric field).

#### Math Utilities (`cpp-engine/math/`)
- **`vector_math`**: Finite-difference divergence/curl helpers for 2D and 3D `GridPoint` structs.
- **`complex_math`**: Complex number arithmetic for phasor calculations.

### 2. Native CLI & Logging (`cmd/`, `logging/`)

The kernel can also be compiled as a standalone CLI application, ideal for hardware-level verification and structured data logging. This implementation serves as a **JKUAT EEE OOP 2nd Year Mini-Project** submission.

- **OOP Principles**: Demonstrates deep use of Inheritance, Polymorphism (virtual interfaces), Abstraction (physics formulas), and Encapsulation.
- **`JsonLogger`**: A dedicated logging utility that captures simulation results (impedance, power, spatial samples) and flushes them to structured JSON files in `logs/`.

### 3. Wasm Bridge & React Hooks (`frontend/src/hooks/`)

Each C++ engine is exposed to JavaScript via **Emscripten Embind** and consumed through dedicated React hooks (e.g., `useWaveEngine`, `useSpatialEngine`).

---

## 🖥️ Visualization Modules

| Module | Canvas | Description |
|--------|--------|-------------|
| **AC Signals** | `<WaveCanvas>` (2D) | Overlaid voltage & current sine waves with real-time slider control |
| **Phasor Diagram** | `<PhasorCanvas>` (2D) | Complex phasor vectors with stationary/animated reference frame toggle |
| **EM Field** | `<FieldCanvas3D>` (Three.js) | 3D instanced vector arrows with adjustable resolution (up to 50³ points) |
| **Vector Calculus** | `<VectorFieldCanvas2D>` (2D) | Divergence, curl, and gradient field visualization with preset fields |

---

## 📈 Quick Start

### Prerequisites
- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html) (for Wasm)
- [MinGW-w64 / GCC](https://www.mingw-w64.org/) (for Native CLI)
- Node.js ≥ 18

### Build & Run

**1. Clone the repo:**
```bash
git clone https://github.com/Mwangi-Derrick/MathLabX.git
cd MathLabX
```

**2. Build & Run Native CLI:**
```bash
# Build the CLI (Windows/Linux)
make cli

# Run simulations and generate JSON logs
make run
```
Logs are saved to `logs/ac_circuit.json`, `phasor.json`, and `spatial_curl.json`.

**3. Build WebAssembly & Launch Frontend:**
```bash
# Build Wasm module
make wasm

# Launch React app
cd frontend
bun install && bun run dev
```

---

## 📐 EEE Formula Reference

Key formulas implemented in the Wasm kernel:

**AC Circuit Analysis:**
* **Inductive Reactance**: $X_L = 2\pi f L$
* **Capacitive Reactance**: $X_C = \frac{1}{2\pi f C}$
* **Impedance**: $Z = \sqrt{R^2 + (X_L - X_C)^2}$
* **Phase Angle**: $\phi = \arctan(\frac{X_L - X_C}{R})$

---

## 🗺️ Project Structure

```
MathlabX/
├── cmd/                      # CLI Entry point (main.cpp)
├── logging/                  # JsonLogger implementation (OOP Encapsulation)
├── cpp-engine/
│   ├── time_domain/          # WaveEngine → ACCircuitEngine → PhasorEngine
│   ├── spatial/              # SpatialFieldEngine → Divergence/Curl/Gradient
│   ├── math/                 # vector_math, complex_math utilities
│   └── bindings/             # Emscripten Embind (mathlab_x.cpp)
├── frontend/                 # React UI + Three.js components
├── wasm/                     # Compiled .mjs + .wasm output
└── makefile                  # Unified build system (CLI + WASM)
```
