# System Architecture & Concurrency

This document provides a high-level overview of the separation of concerns and concurrency considerations within the MathLabX environment.

## 1. The Execution Boundary (Engine/UI)

The application isolates its workload to ensure smooth framerates for the end-user.

### The Numerical Kernel (C++ / WebAssembly)
- Implements core physics structures, trigonometric equations, and array allocation.
- Exposed to JavaScript via Emscripten's `Embind`.
- Lives in an entirely garbage-collection-free memory sandbox, solving performance degradation associated with JS allocations inside a rendering loop.

### The React Renderer (JavaScript / UI Canvas)
- Consumes pre-computed Arrays/Float64 matrix blobs from the Wasm boundary.
- Operates entirely on layout state logic, binding parameters to simulation variables without blocking the visual `requestAnimationFrame` loop with raw mathematics.

## 2. Concurrency Model

A common misconception is that "more threads = faster." However, when pushing thousands of points to a canvas on academic dual-core hardware, aggressive multithreading can reduce performance due to OS scheduling logic.

### Single-Threaded by Default, Parallel by Requirement
- **Avoided: Thread Pools.** Creating dozens of `std::thread` workers on a $2$-core (4 thread) processor leads to "context switching," where the CPU spends more time saving and swapping thread states than generating calculations.
- **Utilized: Task-Level Parallelism (`std::async`).** When massive discrete workloads inevitably trigger (such as re-generating the entire spatial lattice of a Vector Field), the `async` boundary allows that heavy iteration block to spin up quietly outside the main UI rendering thread, preventing browser jank.
- **Future Pursuit: Data-Level Parallelism.** As detailed in `SIMD_DEEP_DIVE.md`, we aim to parallelize the mathematics at the lowest hardware register level (using AVX instructions), rather than forcing the operating system to thread the application.
