#!/usr/bin/env bash
#
# MathlabX — WASM Build Script
#
# Compiles the C++ wave engine to WebAssembly using Emscripten.
# Produces an ES6 module (engine.mjs) + binary (engine.wasm) that
# Vite can import directly as a standard JavaScript module.
#
# Prerequisites:
#   - Emscripten SDK installed and activated (emcc/em++ on PATH)
#   - Run: source /path/to/emsdk/emsdk_env.sh
#
# Usage:
#   chmod +x build.sh
#   ./build.sh
#

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# ─── Configuration ───────────────────────────────────────────────────────────

SOURCE="engine.cpp"                           # C++ source file
OUTPUT_DIR="../frontend/src/wasm"             # Where the frontend expects WASM files
OUTPUT_NAME="engine"                          # Base name for output files

# ─── Verify Emscripten is available ──────────────────────────────────────────

if ! command -v em++ &> /dev/null; then
    echo "❌ em++ not found. Install Emscripten and activate it:"
    echo "   source /path/to/emsdk/emsdk_env.sh"
    exit 1
fi

echo "✓ em++ found: $(em++ --version | head -1)"

# ─── Create output directory ─────────────────────────────────────────────────

mkdir -p "$OUTPUT_DIR"
echo "✓ Output directory: $OUTPUT_DIR"

# ─── Compile ─────────────────────────────────────────────────────────────────
#
# Flag explanations:
#
#   --bind
#       Enables Embind — the C++/JS FFI layer. This is what makes our
#       EMSCRIPTEN_BINDINGS(wave_module) block work, exposing C++ classes
#       and functions to JavaScript.
#
#   -O2
#       Optimization level 2. Produces fast WASM without extreme compile
#       times. -O3 is marginally faster but much slower to compile.
#       -Os optimizes for size instead of speed.
#
#   -s MODULARIZE=1
#       Instead of immediately executing and polluting the global scope,
#       Emscripten emits a FACTORY FUNCTION. The JS side calls this factory
#       to get an initialized module instance. This is critical for:
#         - Multiple instances (not our case, but good practice)
#         - Clean integration with bundlers like Vite/Webpack
#         - No global window.Module pollution
#         - Proper async initialization with Promise return
#
#   -s EXPORT_ES6=1
#       Emits the factory function as a proper ES6 module using
#       `export default`. Combined with the .mjs extension, this lets
#       Vite/bundlers import it like any other module:
#         import createModule from './engine.mjs'
#
#   -s WASM=1
#       Emit actual WebAssembly binary (.wasm file) instead of asm.js
#       fallback. All modern browsers support WASM natively.
#
#   -s ALLOW_MEMORY_GROWTH=1
#       Lets the WASM heap grow dynamically if our vectors get large.
#       Without this, exceeding the initial heap size would crash.
#       Slight performance cost but prevents out-of-memory errors.
#
#   -s ENVIRONMENT=web
#       Target web browsers only (not Node.js). This strips out
#       Node-specific code paths, reducing the JS glue file size.
#
#   -o engine.mjs
#       Output filename. The .mjs extension signals to Vite and Node
#       that this is an ES module (matches EXPORT_ES6=1).
#

echo ""
echo "🔨 Compiling $SOURCE → $OUTPUT_DIR/$OUTPUT_NAME.mjs + $OUTPUT_NAME.wasm"
echo ""

em++ "$SOURCE" \
    -o "$OUTPUT_DIR/$OUTPUT_NAME.mjs" \
    --bind \
    -O2 \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -s WASM=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ENVIRONMENT=web
    # -msimd128: This is the magic flag. It tells the compiler to use 128-bit SIMD instructions. Without this, your C++ might try to use SIMD, but the Wasm binary won't support it.

# ─── Verify output ──────────────────────────────────────────────────────────

echo ""
if [[ -f "$OUTPUT_DIR/$OUTPUT_NAME.mjs" ]] && [[ -f "$OUTPUT_DIR/$OUTPUT_NAME.wasm" ]]; then
    MJS_SIZE=$(wc -c < "$OUTPUT_DIR/$OUTPUT_NAME.mjs" | tr -d ' ')
    WASM_SIZE=$(wc -c < "$OUTPUT_DIR/$OUTPUT_NAME.wasm" | tr -d ' ')
    echo "✓ Build successful!"
    echo "  $OUTPUT_NAME.mjs  — $MJS_SIZE bytes (JS glue code)"
    echo "  $OUTPUT_NAME.wasm — $WASM_SIZE bytes (WebAssembly binary)"
    echo ""
    echo "Frontend can now import the engine:"
    echo "  import createModule from './wasm/engine.mjs'"
else
    echo "❌ Build failed — output files not found"
    exit 1
fi
