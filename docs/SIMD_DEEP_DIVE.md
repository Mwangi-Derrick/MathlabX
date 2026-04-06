# Vectorization & SIMD Architecture Notes

> **Context:** This document outlines the architectural theory and exploration for adding SIMD (Single Instruction, Multiple Data) optimizations to the MathLabX numerical kernel.

## The SIMD Vectorization Model
Standard scalar execution relies on the ALU processing a single value per CPU cycle. In modern hardware (e.g., Intel AVX/AVX2 on Skylake architectures), processors expose 256-bit wide SIMD registers (YMM). These registers are capable of processing 4 `double`-precision floats in a single clock cycle.

### `double` vs `float`
If we dropped precision to 32-bit `float` or `int`, we could theoretically process 8 data points per cycle via AVX2. However, for RLC circuit phase angle derivations and complex vector fields, `double` (64-bit) precision is non-negotiable for numerical stability. Accumulated floating-point error in `float32` corrupts phasor calculations over large sample domains. Hence, our theoretical SIMD optimization leverages a steady 4× throughput limit.

## Calculating Theoretical Performance Ceilings
When exploring optimization boundaries, we use live hardware telemetry to model expected performance. Using a reference **Intel Core i5-6300U**:

- **Clock Frequency ($f_{clock}$)**: $2.40 - 2.50 \text{ GHz}$
- **Physical Cores ($N_{cores}$)**: $2$ (ignoring Hyper-Threading virtual cores)
- **SIMD Width ($W_{simd}$)**: $4$ (`double` floats per cycle)

$$ \text{Peak SIMD Throughput} = f_{clock} \times N_{cores} \times W_{simd} $$
$$ \text{Peak GFLOPS} = 2.5 \times 2 \times 4 = 20 \text{ GFLOPS} $$

Without SIMD (in a standard scalar paradigm), the peak is constrained to roughly $5 \text{ GFLOPS}$. Tracking this theoretical maximum provides a benchmark baseline when evaluating Wasm array generation speeds.

## Emscripten & WebAssembly SIMD
The goal is to unlock the 128-bit Wasm SIMD proposal inside the generated `.wasm` binary via the compiler flag:
```bash
em++ -msimd128 ...
```
When running in Chrome or Firefox, the V8/SpiderMonkey JIT engine automatically translates the 128-bit Wasm instructions into native hardware instructions (falling back to SSE/AVX depending on the host OS architecture).

## Primary References
To understand the rationale behind instruction-level design and C++ performance ceilings, refer to the following authoritative sources:
1. [Intel® 64 and IA-32 Architectures Optimization Reference Manual](https://software.intel.com/content/www/us/en/develop/download/intel-64-and-ia-32-architectures-optimization-reference-manual.html) 
2. [WebAssembly SIMD (128-bit) Specification](https://github.com/WebAssembly/simd)
3. [Agner Fog's Instruction Tables (Instruction timings, latency, and throughput)](https://www.agner.org/optimize/instruction_tables.pdf)
