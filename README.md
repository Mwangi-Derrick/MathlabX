# MathlabX ⚡
### AC & Vector Field Simulator for EEE Students

> **A WebAssembly-powered simulation engine** that visualizes Electromagnetic fields, AC signals, and vector calculus — compiled from C++ and running directly in your browser.

MathLabX bridges the gap between theoretical **Electromagnetics**, **Vector Calculus**, and interactive software. By compiling a C++ numerical kernel to **WebAssembly (Wasm)**, MathLabX lets students and engineers visualize fields and AC signals in real-time.

> 📝 **Note on Hardware Optimization**: SIMD acceleration support and hardware mapping are currently being explored for the numerical kernel. See [`docs/SIMD_DEEP_DIVE.md`](docs/SIMD_DEEP_DIVE.md) for architectural notes.

---

## 🏗️ Core Architecture

MathLabX strictly separates the heavy mathematical computation from the UI rendering layer.

### 1. Numerical Kernel (C++)
The engine is structured around core OOP design:
- **`WaveEngine`**: Base class managing the generation and allocation of the discrete time domain.
- **`ACCircuitEngine`**: Handles RLC phase angle, impedance, and reactive power formulas, generating $V(t)$ and $I(t)$ points.
- **`VectorFieldEngine` / `MultivariateFieldEngine`**: Generates multi-dimensional field vectors using continuous spatial equations.

### 2. Dual Targets (CLI + WASM)
The C++ codebase is designed to compile to standard native binaries (for CLI benchmarking) as well as to a tight Wasm module using Emscripten. Check out [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for more details on the Wasm/React boundaries and concurrency models.

### 3. Data Structures
To maximize performance, the mathematical engine relies heavily on contiguous vectors (e.g., `std::vector<Point3D>`). This structure optimizes memory access and minimizes pipeline stalls. See [`docs/MEMORY_LAYOUT.md`](docs/MEMORY_LAYOUT.md) for the data-oriented design reasoning.

---

## 📈 Quick Start

### Prerequisites
- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html) (`emsdk`)
- Node.js ≥ 18 + npm

### Build & Run
**1. Clone the repo:**
```bash
git clone https://github.com/Mwangi-Derrick/MathLabX.git
cd MathLabX
```

**2. Compile the C++ Wasm kernel:**
```bash
em++ -O3 --bind -s WASM=1 -o engine.mjs engine.cpp
```

**3. Launch the React frontend:**
```bash
cd frontend
npm install
npm start
```
Open `http://localhost:3000` to interact with the simulations.

---

## 📐 EEE Formula Reference

Key formulas implemented in the Wasm kernel:
* **Inductive Reactance**: $X_L = 2\pi f L$
* **Capacitive Reactance**: $X_C = \frac{1}{2\pi f C}$
* **Impedance**: $Z = \sqrt{R^2 + (X_L - X_C)^2}$
* **Phase Angle**: $\phi = \arctan(\frac{X_L - X_C}{R})$

---

## 🗺️ Extensibility
Engineered for easy integration of:
- **Divergence Visualizer** ($\nabla \cdot \mathbf{F}$)
- **Maxwell's Curl** ($\nabla \times \mathbf{F}$)
- **Equipotential Surfaces**
- **3D Field Renderer**
