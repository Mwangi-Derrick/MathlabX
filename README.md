# MathlabX
AC & Vector Field Simulator for EEE Students

## **🚀 Project Description**

MathLabX is a **high-performance, interactive simulation engine** built to bridge the gap between theoretical **Electromagnetics**, **Vector Calculus**, and **Silicon-Level Hardware Optimization**. By compiling a C++ numerical kernel to **WebAssembly (Wasm)**, MathLabX allows students and engineers to **visualize fields, AC signals, and vector behaviors in real-time**, directly in the browser. 

Unlike traditional mathematical tools that treat the CPU as a black box, this engine is meticulously designed with system architecture in mind, pushing standard university laboratory hardware (like the Intel Core i5-6300U) to its absolute theoretical floating-point limits.

---

## **⚡ Hardware-Aware Execution (Mapping Code to Silicon)**

As EEE students, our goal isn't just to write software that complies; it's to write software that respects the silicon it executes on. This simulation engine implements **Data-Oriented Design** and **High-Performance Computing (HPC)** principles.

### **1. The SIMD Jackpot: AVX and AVX2 Vectorization**
Standard scalar execution in C++ relies on the ALU processing a single instruction per CPU cycle. However, by querying the CPU `flags` (e.g., via `lscpu`), we expose capabilities like **AVX and AVX2**. 
* AVX2 equips the CPU with **256-bit wide SIMD (Single Instruction, Multiple Data) registers**. 
* **The Math**: Since our simulation relies heavily on 64-bit `double` precision floating-point numbers, a single 256-bit YMM register can pack and process **4 doubles simultaneously** per core in a single clock cycle. 
* **The Compromise**: If we dropped precision to 32-bit `float` or `int`, we could theoretically process **8 data points per cycle**. However, for RLC Circuit phase angle derivations and Complex Vector Fields, `double` precision is non-negotiable for numerical stability. We accept the 4x throughput as the optimal engineering tradeoff.

### **2. Calculating Theoretical Peak GFLOPS**
Using live hardware telemetry (monitoring `/proc/cpuinfo` for active $f_{clock}$), the engine can calculate its hardware efficiency ceiling:
* **Base Frequency ($f_{clock}$)**: $2.40 - 2.50 \text{ GHz}$
* **Physical Cores ($N_{cores}$)**: $2$ (We map to real silicon, ignoring Hyper-Threading ảo cores to avoid context-switching delays)
* **SIMD Width ($W_{simd}$)**: $4$ (using 64-bit data in 256-bit registers)

$$ \text{Peak SIMD Throughput} = f_{clock} \times N_{cores} \times W_{simd} $$
$$ \text{Peak GFLOPS} = 2.5 \times 2 \times 4 = 20 \text{ GFLOPS} $$
Without AVX2 SIMD optimizations, our computational ceiling would be bottlenecked at a mere **5 GFLOPS**, devastating our ability to render massive real-time vector fields at 60 FPS.

### **3. Demystifying L1 Cache & Concurrency Stalls**
At $2.5$ GHz, CPU cycles are measured in fractions of a nanosecond. RAM latency, by contrast, is an eternity. 
* **L1 Data Cache**: The i5-6300U operates with a minuscule **64KiB L1 Cache**. We designed our contiguous `Point3D` and `Point2D` Vectors specifically so the hardware prefetcher can stream rendering data flawlessly into the fast L1 cache, avoiding pipeline stalls caused by L2/L3 memory fetches.
* **Targeted Concurrency**: Since the targeted processor only possesses 2 physical cores, spawning dozens of threads via `std::thread` would actually degrade performance due to OS scheduler overhead. Instead, we heavily prioritize **Data-Level Parallelism (SIMD)** and reserve **Task-Level Parallelism** (`std::async`) strictly for bifurcating the heavy Field Simulation payload away from the React UI render cycle.

---

## **💡 Purpose / Motivation**

Traditional EEE modules (like 2.2 Electromagnetics) rely heavily on paper calculations and static diagrams, creating an abstraction layer that obscures how electromagnetic fields behave dynamically. MathLabX:

- Provides a **visceral, mathematically-rigorous** representation of vector calculus operations.
- Translates EEE formulas (Phasors, Vrms, Reactance) into executing geometry.
- Acts as an R&D testbed highlighting the intersection between Hardware Architecture and Real-Time Graphics.

---

## **🛠️ Features**

- **AC Circuit Simulator**: Renders real-time V(t) and I(t) AC waveforms driven by Inductive and Capacitive Reactance computations.
- **Hardware Telemetry Context**: Understand what your hardware is actually doing (GHz vs effective GFLOPS) while visual rendering takes place.
- **Wasm & SIMD Fusion**: Near-native execution speeds running directly in standard browsers (Chrome/Firefox/Edge).
- **Responsive Dynamic Load**: Automatically adapts mathematical load (sample generation density) so the browser maintains UI fluidity under heavy matrix transformations.
- **Extensible Architecture**: Engineered specifically for easy integration of Divergence equations, Maxwell's Curl calculations, and equipotential graphing algorithms.

---

## **⚙️ Tech Stack**

| Layer | Technology | Purpose |
| --- | --- | --- |
| Numerical Kernel | C++ (RAII & Vectorization) | Implements heavy data parallel computations & engineering formulas |
| Compiler | **Emscripten / Embind** | Low-level LLVM bridging C++ classes directly into JavaScript contexts |
| Display | React + HTML5 Canvas | Event-driven UI matching native engine speed limits |
| Execution | WebAssembly (Wasm) | V8 Engine binary execution sandbox |

---

## **📈 Quick Start**

1. Clone the repository:
```bash
git clone https://github.com/Mwangi-Derrick/MathLabX.git  
cd MathLabX
```

2. Build the C++ Wasm kernel (Ensure Emscripten is installed, and SIMD flags `-msimd128` enabled if extending the engine):
```bash
em++ -O3 --bind -s WASM=1 -o engine.mjs engine.cpp
```

3. Launch the React dev server:
```bash
cd frontend
npm install  
npm start
```

4. Navigate to `http://localhost:3000`. Adjust the sliders to force capacitive leading/inductive lagging currents, taking note of how effortlessly your physical CPU crunches the raw data payload required to plot thousands of sample points instantly.
