# 🧮 Math Kernel Deep Dive: C++ vs. JavaScript

This document provides a technical audit of the **MathlabX** simulation engine, clarifying the separation of concerns between the **C++ Numerical Kernel** (The Brain) and the **React/Three.js Frontend** (The Painter).

---

## 🏗️ The Architectural Line in the Sand

| Task | Language | Implementation |
| :--- | :--- | :--- |
| **Complex Arithmetic** | C++ | `complex_math.h` (Operator overloading for `+`, `-`, `*`, `/`) |
| **Circuit Physics** | C++ | `ACCircuitEngine.cpp` (Reactance, Impedance, Phase Angle) |
| **Frequency Sweeps** | C++ | `FrequencyResponseEngine.cpp` (Sweep logic & gain calculations) |
| **Phasor Translation** | C++ | `PhasorEngine.h` (Real/Imaginary coordinate generation) |
| **Data Buffering** | C++ | `WaveEngine.cpp` (Memory allocation for waveform points) |
| **3D Rendering** | JavaScript | `WaveCanvas3D.tsx` (React-Three-Fiber / WebGL) |
| **UI Orchestration** | JavaScript | `useACCircuit.ts` (WASM Module lifecycle management) |

---

## 🧪 Physics to Code Mapping

### 1. AC Reactance & Impedance
**Formula:**
$$X_L = 2\pi f L, \quad X_C = \frac{1}{2\pi f C}$$
$$Z = \sqrt{R^2 + (X_L - X_C)^2}$$

**C++ Implementation (`ACCircuitEngine.cpp`):**
```cpp
double ACCircuitEngine::getInductiveReactance() const {
    return 2.0 * M_PI * frequency * L;
}

double ACCircuitEngine::getImpedance() const {
    double xl = getInductiveReactance();
    double xc = getCapacitiveReactance();
    return std::sqrt(R * R + (xl - xc) * (xl - xc));
}
```

### 2. Complex Phasor Coordinates
The frontend **does not** know how to rotate a vector or calculate its offset. It asks the C++ kernel for a "State" at time $t$.

**C++ Logic (`PhasorEngine.h`):**
```cpp
// Generates the source voltage phasor as a complex coordinate
// vs(t) = Vm * exp(j(wt + phi))
return Complex::fromPolar(source_peak, omega * t);
```

### 3. The Frequency Sweep (Bode Data)
To draw the frequency response curve, the engine must simulate the circuit hundreds of times per second.

**C++ Implementation (`FrequencyResponseEngine.cpp`):**
```cpp
void FrequencyResponseEngine::sweepFrequency(double start, double end, int points) {
    for (int i = 0; i < points; ++i) {
        // ... Logarithmic or linear step calculation
        // Each point calculates H(jw) = 1 / (1 + jQ(w/w0 - w0/w))
        results.push_back({f, gain_db, phase_deg});
    }
}
```

---

## ⚡ The Wasm Memory Bridge (Proof of Work)

The absolute proof that C++ is doing the work lies in the **Embind interface** (`mathlab_x.cpp`).

When JavaScript calls:
```typescript
const state = engine.getPhasorState(time);
```

It is executing a **direct jump into WebAssembly linear memory**. The C++ kernel:
1. Calculates the trigonometry using its internal `double` precision registers.
2. Packages the results into a C++ `struct`.
3. Passes a memory reference back to JS.

**JavaScript never sees the formulas.** If you delete the `wasm/` folder, the entire math system dies, even though the UI is still visible. This proves the **Interoperability** model where C++ is the "Mathematical Source of Truth."

---

## 📉 Why not just use JS?
1. **Precision:** C++ uses standard-compliant IEEE 754 double precision consistently across all platforms.
2. **Speed:** High-resolution 3D fields (50x50x50 points) require **SIMD (Single Instruction, Multiple Data)** optimizations which are available in C++ via Wasm, but not in standard JS loops.
3. **Portability:** This exact same math kernel runs in the **Native CLI** (`make cli`), proving the math is independent of the browser.
