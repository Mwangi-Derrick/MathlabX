# MathlabX ⚡

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-✓-654FF0.svg)](https://webassembly.org/)
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

The engine is structured around two parallel class hierarchies — one for **time-domain** analysis and one for **spatial field** computation:

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

### 2. Wasm Bridge & React Hooks (`frontend/src/hooks/`)

Each C++ engine is exposed to JavaScript via **Emscripten Embind** and consumed through dedicated React hooks:

| Hook | C++ Engine | Visualization Page |
|------|------------|-------------------|
| `useWaveEngine` | `ACCircuitEngine` | **AC Signals** — real-time V(t), I(t) waveforms |
| `usePhasorEngine` | `PhasorEngine` | **Phasor Diagram** — rotating/stationary vector diagrams |
| `useSpatialEngine` | `CurlEngine3D` | **EM Field** — interactive 3D vector field (Three.js) |
| `useVectorCalc` | `DivergenceEngine2D` / `CurlEngine2D` / `GradientEngine2D` | **Vector Calc** — 2D ∇·F, ∇×F, ∇f visualization |

Hooks handle WASM module lifecycle (load → compute → hot-swap on resolution change) without re-triggering loading states.

### 3. Data Structures

To maximize performance, the mathematical engine relies on contiguous vectors (e.g., `std::vector<GridPoint3D>`). This structure optimizes memory access and minimizes cache misses. See [`docs/MEMORY_LAYOUT.md`](docs/MEMORY_LAYOUT.md) for the data-oriented design reasoning.

```cpp
struct GridPoint3D {
    double x, y, z;       // Position
    double fx, fy, fz;    // Field vector
    double divergence;    // ∇·F
    double curl_x, curl_y, curl_z;  // ∇×F
};
```

---

## 🖥️ Visualization Modules

| Module | Canvas | Description |
|--------|--------|-------------|
| **AC Signals** | `<WaveCanvas>` (2D) | Overlaid voltage & current sine waves with real-time slider control |
| **Phasor Diagram** | `<PhasorCanvas>` (2D) | Complex phasor vectors with stationary/animated reference frame toggle |
| **EM Field** | `<FieldCanvas3D>` (Three.js) | 3D instanced vector arrows with adjustable resolution (up to 50³ points) |
| **Vector Calculus** | `<VectorFieldCanvas2D>` (2D) | Divergence, curl, and gradient field visualization with preset fields |

All modules support **Simple Mode** (full-screen immersive) and **Advanced Mode** (sidebar with metrics & theory). A global **Light/Dark theme toggle** is available in the top bar.

---

## 📈 Quick Start

### Prerequisites
- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html) (`emsdk`)
- Node.js ≥ 18 (npm or bun)

### Build & Run

**1. Clone the repo:**
```bash
git clone https://github.com/Mwangi-Derrick/MathLabX.git
cd MathLabX
```

**2. Compile the C++ Wasm kernel:**
```bash
cd cpp-engine
source /path/to/emsdk/emsdk_env.sh
chmod +x build.sh
./build.sh
```
This compiles all engines into `frontend/src/wasm/mathlab_x.mjs` + `mathlab_x.wasm` using Embind, ES6 modules, and `-O2` optimization.

**3. Launch the React frontend:**
```bash
cd frontend
npm install   # or: bun install
npm run dev   # or: bun run dev
```
Open `http://localhost:5173` to interact with the simulations.

---

## 📐 EEE Formula Reference

Key formulas implemented in the Wasm kernel:

**AC Circuit Analysis:**
* **Inductive Reactance**: $X_L = 2\pi f L$
* **Capacitive Reactance**: $X_C = \frac{1}{2\pi f C}$
* **Impedance**: $Z = \sqrt{R^2 + (X_L - X_C)^2}$
* **Phase Angle**: $\phi = \arctan(\frac{X_L - X_C}{R})$

**Vector Calculus:**
* **Divergence**: $\nabla \cdot \mathbf{F} = \frac{\partial F_x}{\partial x} + \frac{\partial F_y}{\partial y} + \frac{\partial F_z}{\partial z}$
* **Curl**: $\nabla \times \mathbf{F} = \left(\frac{\partial F_z}{\partial y} - \frac{\partial F_y}{\partial z}\right)\hat{i} + \left(\frac{\partial F_x}{\partial z} - \frac{\partial F_z}{\partial x}\right)\hat{j} + \left(\frac{\partial F_y}{\partial x} - \frac{\partial F_x}{\partial y}\right)\hat{k}$
* **Gradient**: $\nabla f = \frac{\partial f}{\partial x}\hat{i} + \frac{\partial f}{\partial y}\hat{j}$

---

## 🗺️ Project Structure

```
MathlabX/
├── cpp-engine/
│   ├── time_domain/          # WaveEngine → ACCircuitEngine → PhasorEngine
│   ├── spatial/              # SpatialFieldEngine → Divergence/Curl/Gradient
│   ├── math/                 # vector_math, complex_math utilities
│   ├── bindings/             # Emscripten Embind (mathlab_x.cpp)
│   ├── shared/               # Shared structs (Point2D, GridPoint3D, etc.)
│   └── build.sh              # Wasm build script
├── frontend/
│   ├── src/
│   │   ├── routes/           # Page components (ACSignals, Phasor, EMField, VectorCalc)
│   │   ├── components/       # Canvas renderers (WaveCanvas, PhasorCanvas, FieldCanvas3D, etc.)
│   │   ├── hooks/            # React hooks bridging WASM engines to UI
│   │   ├── lib/              # WASM loader + type re-exports
│   │   └── App.tsx           # Shell with routing, theme toggle, Simple/Advanced mode
│   ├── types/                # TypeScript declarations for Embind interfaces
│   └── wasm/                 # Compiled .mjs + .wasm output (git-ignored)
└── docs/                     # Architecture, SIMD, and memory layout docs
```

