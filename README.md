# MathlabX ⚡
### AC & Vector Field Simulator for EEE Students

> **A hardware-aware, WebAssembly-powered simulation engine** that visualizes Electromagnetic fields, AC signals, and vector calculus — compiled from C++ and running at near-native speeds directly in your browser.

---

## 🚀 Project Description

MathLabX bridges the gap between theoretical **Electromagnetics**, **Vector Calculus**, and real silicon execution. By compiling a C++ numerical kernel to **WebAssembly (Wasm)**, MathLabX lets students and engineers **visualize fields, AC signals, and vector behaviors in real-time** — no plugins, no installs, just a browser.

Unlike traditional math tools that treat the CPU as a black box, this engine is built with **system architecture in mind** — designed to push standard university lab hardware to its absolute theoretical floating-point ceiling.

> 🖥️ **Host Machine**: All performance figures below were measured on and tuned for the **Intel Core i5-6300U** — the actual CPU this project was developed and tested on.

---

## ⚡ Hardware-Aware Execution — Mapping Code to Silicon

As EEE students, our goal isn't just to write software that *compiles* — it's to write software that **respects the silicon it executes on**. This engine implements **Data-Oriented Design** and **HPC (High-Performance Computing)** principles.

---

### 1. The SIMD Jackpot: AVX and AVX2 Vectorization

> **Glossary**
> - **SIMD** *(Single Instruction, Multiple Data)*: A CPU execution model where *one* instruction operates on *multiple* data points simultaneously, using special wide registers. Think of it as batch processing at the hardware level.
> - **AVX / AVX2** *(Advanced Vector Extensions)*: Intel's SIMD instruction set extensions, introduced in Sandy Bridge (AVX) and Haswell (AVX2). AVX2 gives us 256-bit wide registers capable of processing 4× 64-bit doubles at once.
> - **YMM Registers**: The 256-bit wide SIMD registers exposed by AVX2. Named `ymm0–ymm15`. The "Y" in YMM = 256-bit (vs. XMM = 128-bit for SSE).
> - **ALU** *(Arithmetic Logic Unit)*: The part of the CPU that performs arithmetic and logic operations. In scalar mode, it handles one value per clock cycle.

Standard scalar execution relies on the **ALU** processing a single value per CPU cycle. By querying CPU flags via `lscpu`, we expose **AVX2** — 256-bit wide **SIMD** registers that let us pack 4 `double`-precision floats into a single **YMM register** and process all four in one clock cycle.

| Mode | Data Width | Doubles per Cycle | Notes |
|------|-----------|-------------------|-------|
| Scalar (no SIMD) | 64-bit | 1 | One value, one operation |
| SSE2 | 128-bit XMM | 2 | Legacy SIMD baseline |
| **AVX2 (this engine)** | **256-bit YMM** | **4** | ✅ Current implementation |
| AVX2 with `float` | 256-bit YMM | 8 | Lower precision — rejected |

**Why not `float` for 8× throughput?** For RLC circuit phase angle derivations and complex vector fields, `double` precision is **non-negotiable** for numerical stability. Accumulated floating-point error in `float32` would corrupt phasor calculations over thousands of sample points. We accept 4× throughput as the optimal engineering tradeoff.

---

### 2. Calculating Theoretical Peak GFLOPS

> **Glossary**
> - **GFLOPS** *(Giga Floating-Point Operations Per Second)*: A measure of computational throughput — how many floating-point math operations a processor can execute per second, in billions.
> - **Clock Frequency** ($f_{clock}$): The number of cycles per second the CPU executes, in GHz. Higher frequency = more operations per second.
> - **Hyper-Threading**: Intel's simultaneous multithreading (SMT) technology — it exposes 2 virtual "logical" cores per physical core. We ignore these for SIMD work because they share the same physical execution unit and introduce scheduling overhead without doubling SIMD throughput.

Using live hardware telemetry from `/proc/cpuinfo`, the engine calculates its hardware efficiency ceiling. These are the **actual measured values from the host development machine** (Intel Core i5-6300U):

| Parameter | Symbol | Host Machine Value |
|-----------|--------|--------------------|
| Clock Frequency | $f_{clock}$ | $2.40 - 2.50 \text{ GHz}$ |
| Physical Cores | $N_{cores}$ | $2$ (ignoring HT virtual cores) |
| SIMD Width (AVX2, `double`) | $W_{simd}$ | $4$ doubles per cycle |

**Peak SIMD Throughput formula:**

$$\text{Peak GFLOPS} = f_{clock} \times N_{cores} \times W_{simd}$$

**With AVX2 SIMD** (the engine's actual mode):

$$\text{Peak GFLOPS} = 2.5 \times 2 \times 4 = \boxed{20 \text{ GFLOPS}}$$

**Without SIMD** (scalar fallback):

$$\text{Scalar GFLOPS} = 2.5 \times 2 \times 1 = \boxed{5 \text{ GFLOPS}}$$

> 📌 SIMD vectorization delivers a **4× throughput gain** on the host machine — the difference between smooth 60 FPS vector field rendering and a slideshow.

---

### 3. Memory Hierarchy & Cache Efficiency

> **Glossary**
> - **L1 Cache**: The fastest, smallest cache sitting directly on the CPU die. Latency: ~1–4 CPU cycles. Size is intentionally small (typically 32–64 KiB) to stay on-chip.
> - **L2 / L3 Cache**: Larger but slower caches. L2 is per-core; L3 is shared across cores. Latency escalates from ~10 cycles (L2) to ~40 cycles (L3).
> - **DRAM / RAM**: Main memory. Latency: ~100–300 cycles. A "cache miss" that falls through to RAM stalls the pipeline and devastates throughput.
> - **Hardware Prefetcher**: A CPU subsystem that predicts which memory addresses will be needed next and pre-loads them into cache *before* the CPU requests them. It works best on **sequential, stride-1 memory access patterns**.
> - **Cache Line**: The minimum unit of memory the CPU fetches — typically 64 bytes. Accessing one byte pulls in the whole 64-byte cache line.
> - **Pipeline Stall**: When the CPU cannot proceed with the next instruction because it's waiting for data (e.g., a cache miss). Stalls waste cycles that could be doing useful work.
> - **AoS vs SoA** *(Array of Structs vs Struct of Arrays)*: Layout strategies for structured data. SoA packs the same field for many objects contiguously, which is preferable for SIMD since it processes the same field across many data points in parallel.

**Host machine L1 specification:**

| Cache Level | Size (i5-6300U) | Latency |
|-------------|-----------------|---------|
| **L1 Data** | **64 KiB** | ~4 cycles |
| L2 (per core) | 256 KiB | ~12 cycles |
| L3 (shared) | 3 MiB | ~36 cycles |
| DRAM | ∞ (effectively) | ~200+ cycles |

At 2.5 GHz, one CPU cycle is **0.4 ns**. A RAM fetch (~200 cycles) costs **80 ns** — an eternity in compute time. Our `Point3D` and `Point2D` structs are designed as **contiguous arrays** specifically so the hardware prefetcher can stream rendering data sequentially into L1 cache, avoiding pipeline stalls from L2/L3 fetches.

---

### 4. Concurrency Model: SIMD-First, Threads-Second

> **Glossary**
> - **Data-Level Parallelism (DLP)**: Doing the *same operation* on *multiple data items* simultaneously — achieved via SIMD. Fast, zero-overhead, no OS involvement.
> - **Task-Level Parallelism (TLP)**: Splitting *different tasks* across separate threads or cores. Useful for bifurcating compute from UI, but carries OS scheduler and context-switch overhead.
> - **`std::async`**: C++ standard library facility for launching asynchronous tasks — lighter than raw `std::thread` for fire-and-forget workloads.
> - **Context Switch**: The OS saving one thread's state and restoring another's. Takes ~1–10 µs and pollutes the CPU cache — a real cost at high thread counts.
> - **OS Scheduler Overhead**: The CPU cycles consumed managing thread queues, locks, and context switches. On a 2-core machine, this overhead dominates if too many threads compete.

The host machine has **2 physical cores**. Spawning dozens of threads via `std::thread` would cause the OS scheduler to thrash between them, negating any parallelism gain. Our strategy:

```
Primary parallelism:  SIMD (AVX2)   ← processes 4× data per cycle, zero overhead
Secondary parallelism: std::async   ← bifurcates heavy field simulation from React UI render cycle
Avoided:              std::thread pools ← overkill for a 2-core machine, creates scheduler overhead
```

---

## 💡 Purpose / Motivation

Traditional EEE modules (like **2.2 Electromagnetics**) rely heavily on paper calculations and static diagrams, creating an abstraction layer that obscures how electromagnetic fields behave dynamically. MathLabX:

- Provides a **visceral, mathematically-rigorous** representation of vector calculus operations
- Translates EEE formulas (Phasors, $V_{rms}$, Reactance $X_L$ and $X_C$) into executing geometry
- Acts as an R&D testbed highlighting the intersection of **Hardware Architecture** and **Real-Time Graphics**

---

## 🛠️ Features

- **AC Circuit Simulator** — Renders real-time $V(t)$ and $I(t)$ AC waveforms driven by Inductive ($X_L = \omega L$) and Capacitive ($X_C = \frac{1}{\omega C}$) Reactance computations
- **Hardware Telemetry Context** — Live display of GHz vs effective GFLOPS while rendering
- **Wasm & SIMD Fusion** — Near-native execution in Chrome / Firefox / Edge via the V8/SpiderMonkey JIT engine
- **Responsive Dynamic Load** — Automatically adapts sample generation density to maintain UI fluidity under heavy matrix transformations
- **Extensible Architecture** — Engineered for easy integration of Divergence ($\nabla \cdot \mathbf{F}$), Maxwell's Curl ($\nabla \times \mathbf{F}$), and equipotential graphing

---

## ⚙️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Numerical Kernel** | C++ (RAII + AVX2 Vectorization) | Heavy data-parallel computations & EEE formulas |
| **Compiler** | [Emscripten](https://emscripten.org/) / Embind | LLVM-based toolchain bridging C++ classes into JavaScript |
| **Display** | React + HTML5 Canvas | Event-driven UI matched to native engine speed limits |
| **Execution Target** | WebAssembly (Wasm) | Binary execution sandbox inside the browser's V8 engine |

> **Glossary**
> - **Emscripten**: An LLVM-based compiler toolchain that compiles C/C++ to WebAssembly. It handles the translation layer, memory model mapping, and JavaScript binding generation.
> - **Embind**: Emscripten's binding library — lets you expose C++ classes and functions directly to JavaScript as if they were native JS objects.
> - **WebAssembly (Wasm)**: A binary instruction format designed as a portable compilation target for the web. Executes at near-native speed inside the browser's sandboxed VM.
> - **RAII** *(Resource Acquisition Is Initialization)*: A C++ idiom where resources (memory, file handles, etc.) are tied to object lifetimes — acquired in constructors, released in destructors. Prevents memory leaks without a garbage collector.
> - **V8**: Google's open-source JavaScript and WebAssembly engine, used in Chrome and Node.js. It JIT-compiles Wasm to native machine code at runtime.

---

## 📈 Quick Start

### Prerequisites

- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html) (`emsdk`)
- Node.js ≥ 18 + npm
- A modern browser (Chrome 91+, Firefox 89+, or Edge 91+ for Wasm SIMD support)

### Build

**1. Clone the repo:**
```bash
git clone https://github.com/Mwangi-Derrick/MathLabX.git
cd MathLabX
```

**2. Compile the C++ Wasm kernel:**
```bash
em++ -O3 --bind -s WASM=1 -o engine.mjs engine.cpp
```

> To enable Wasm SIMD (maps to AVX2 on desktop browsers), add `-msimd128` to the compile flags. This unlocks the 128-bit SIMD instruction set in the Wasm binary — the browser's JIT then maps these to native AVX2 instructions where available.

**3. Launch the React frontend:**
```bash
cd frontend
npm install
npm start
```

**4. Open `http://localhost:3000`** — adjust the sliders to force capacitive (leading) or inductive (lagging) currents and observe how effortlessly the host CPU renders thousands of sample points in real time.

---

## 📐 EEE Formula Reference

Key formulas implemented in the numerical kernel:

| Concept | Formula | Description |
|---------|---------|-------------|
| Inductive Reactance | $X_L = \omega L = 2\pi f L$ | Opposition to AC from an inductor |
| Capacitive Reactance | $X_C = \dfrac{1}{\omega C} = \dfrac{1}{2\pi f C}$ | Opposition to AC from a capacitor |
| Impedance (RLC) | $Z = \sqrt{R^2 + (X_L - X_C)^2}$ | Total opposition to AC flow |
| Phase Angle | $\phi = \arctan\!\left(\dfrac{X_L - X_C}{R}\right)$ | Current lead/lag relative to voltage |
| RMS Voltage | $V_{rms} = \dfrac{V_{peak}}{\sqrt{2}}$ | Equivalent DC heating value of AC signal |
| AC Waveform | $V(t) = V_{peak}\sin(\omega t + \phi)$ | Instantaneous voltage over time |

---

## 🗺️ Roadmap

- [ ] **Divergence Visualizer** — $\nabla \cdot \mathbf{F}$ field source/sink mapping
- [ ] **Maxwell's Curl** — $\nabla \times \mathbf{F}$ rotational field renderer  
- [ ] **Equipotential Surfaces** — 2D contour plotting over vector fields
- [ ] **Phasor Diagram** — Interactive rotating phasor with live impedance triangle
- [ ] **3D Field Renderer** — WebGL-backed volume rendering for 3D vector fields
- [ ] **Wasm SIMD Benchmark** — Live GFLOPS meter comparing scalar vs SIMD throughput

---

## 📄 License

MIT © [Mwangi-Derrick](https://github.com/Mwangi-Derrick)
