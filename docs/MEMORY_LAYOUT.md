# CPU Cache & Memory Layout Guidelines

> **Context:** This document explains the rationale behind the primary data structures used in the MathLabX simulation engine, focusing heavily on Data-Oriented Design (DOD).

At high clock speeds (e.g., $2.5 \text{ GHz}$), one CPU cycle executes in a tiny fraction of a nanosecond. By contrast, a standard L3 cache miss that forces a fetch from Main Memory (DRAM) can delay the processor by over $200$ cycles. This discrepancy means that a mathematically clever algorithm will completely fail if memory access is unoptimized.

## Predictable Memory and the Hardware Prefetcher
Modern microprocessors are paired with a "Hardware Prefetcher" — a silicon subsystem designed to monitor memory fetches. If the prefetcher sees your software requesting memory addresses `[x]`, `[x+1]`, and `[x+2]`, it will preemptively load `[x+3]`, `[x+4]`, and `[x+5]` into the ultra-fast L1 Data Cache (e.g., 64 KiB).

For the prefetcher to be reliable, code must exhibit specific properties:
1. Sequential, stride-1 access patterns.
2. Contiguous spatial locality.

## Structural Strategy: Vectors over Linked Lists
In MathLabX, objects and spatial bounds are organized using continuous arrays.

- **Data Models**: Basic models like `Point2D { double x; double y; }`.
- **Containers**: Vectors such as `std::vector<Point2D>` are preferred over abstractions like arrays of pointers or `std::list`.

By pushing these points into contiguous vectors, allocating exact sizes via `.reserve(samples)`, and iterating over them sequentially, we guarantee optimal spatial locality. When generating millions of Vector Field vectors per second, this structure streams perfectly aligned sequential memory blocks directly into the L1 cache.

As a result, CPU "pipeline stalls" are nearly eliminated, allowing raw ALU computation capabilities to dominate execution runtimes.
