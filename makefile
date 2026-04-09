# Makefile for MathlabX - Supports Native CLI & WebAssembly Builds
# Usage:
#   make cli        - Build native CLI
#   make wasm       - Build WebAssembly module
#   make all        - Build both
#   make clean      - Clean all builds
#   make run        - Run native CLI
#   make help       - Show available commands

# ============================================================================
# Native CLI Configuration (Windows/MinGW)
# ============================================================================
CLI_CXX      = g++
CLI_CXXFLAGS = -Wall -std=c++17 -O2 -static
CLI_INCLUDES = -Icpp-engine/math \
               -Icpp-engine/spatial \
               -Icpp-engine/time_domain \
               -Ilogging \
               -I.

CLI_TARGET   = cmd/cli.exe

# Separate object dir for CLI - FIXES the pattern rule collision with WASM
CLI_BUILD_DIR = build/cli

CLI_SRCS = cmd/main.cpp \
           cpp-engine/time_domain/ACCircuitEngine.cpp \
           cpp-engine/time_domain/WaveEngine.cpp \
           cpp-engine/spatial/curl.cpp \
           cpp-engine/spatial/divergence.cpp \
           cpp-engine/spatial/spatialEngine.cpp \
           cpp-engine/spatial/streamline.cpp \
           cpp-engine/spatial/Theorems.cpp \
           cpp-engine/math/vector_math.cpp \
           logging/JsonLogger.cpp

# Map source paths -> build/cli/*.o (flattened, no subdir conflicts)
CLI_OBJS = $(patsubst %.cpp,$(CLI_BUILD_DIR)/%.o,$(subst /,_,$(CLI_SRCS)))

# ============================================================================
# WebAssembly Configuration (Emscripten)
# ============================================================================
EMSDK_PATH   = /c/Users/user/emsdk/upstream/emscripten
WASM_CXX     = $(EMSDK_PATH)/em++.bat

WASM_CXXFLAGS = -O3 -msimd128 -std=c++17 -Wall \
                -Icpp-engine/math \
                -Icpp-engine/spatial \
                -Icpp-engine/time_domain \
                -Icpp-engine/bindings \
                -Ilogging

WASM_LDFLAGS  = --bind \
                -s MODULARIZE=1 \
                -s EXPORT_ES6=1 \
                -s EXPORT_NAME=createMathlabXModule \
                -s ALLOW_MEMORY_GROWTH=1 \
                -s WASM=1 \
                -s FILESYSTEM=0 \
                -s ASSERTIONS=0

WASM_TARGET   = wasm/mathlab_x.mjs

WASM_BUILD_DIR = build/wasm

WASM_SRCS = cpp-engine/math/vector_math.cpp \
            cpp-engine/spatial/spatialEngine.cpp \
            cpp-engine/spatial/curl.cpp \
            cpp-engine/spatial/divergence.cpp \
            cpp-engine/spatial/streamline.cpp \
            cpp-engine/spatial/Theorems.cpp \
            cpp-engine/time_domain/ACCircuitEngine.cpp \
            cpp-engine/time_domain/WaveEngine.cpp \
            cpp-engine/bindings/mathlab_x.cpp

WASM_OBJS = $(patsubst %.cpp,$(WASM_BUILD_DIR)/%.o,$(subst /,_,$(WASM_SRCS)))

# ============================================================================
# Colors
# ============================================================================
GREEN  = \033[0;32m
RED    = \033[0;31m
YELLOW = \033[1;33m
BLUE   = \033[0;34m
NC     = \033[0m

# ============================================================================
# Phony targets
# ============================================================================
.PHONY: all clean help run debug-cli debug-wasm prod-wasm \
        cli wasm clean-cli clean-wasm ensure-dirs fast-cli

# ============================================================================
# Build targets
# ============================================================================
all: cli wasm
	@echo "$(GREEN)✓ Complete build finished!$(NC)"

# --- Native CLI ---
cli: ensure-dirs $(CLI_TARGET)
	@echo "$(GREEN)✓ CLI build complete!$(NC)"
	@echo "$(YELLOW)Run with: make run$(NC)"

$(CLI_TARGET): $(CLI_OBJS)
	@echo "Linking $@..."
	$(CLI_CXX) -static $(CLI_OBJS) -o $(CLI_TARGET)
	@echo "$(GREEN)✓ Created $(CLI_TARGET)$(NC)"

# Generic CLI compile rule: build/cli/path_with_underscores.o <- original src
# We define explicit rules per source to keep it readable and collision-free.
$(CLI_BUILD_DIR)/cmd_main.o: cmd/main.cpp
	@echo "Compiling $<..."
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) -c $< -o $@

$(CLI_BUILD_DIR)/logging_JsonLogger.o: logging/JsonLogger.cpp
	@echo "Compiling $<..."
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) -c $< -o $@

$(CLI_BUILD_DIR)/cpp-engine_time_domain_ACCircuitEngine.o: cpp-engine/time_domain/ACCircuitEngine.cpp
	@echo "Compiling $<..."
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) -c $< -o $@

$(CLI_BUILD_DIR)/cpp-engine_time_domain_WaveEngine.o: cpp-engine/time_domain/WaveEngine.cpp
	@echo "Compiling $<..."
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) -c $< -o $@

$(CLI_BUILD_DIR)/cpp-engine_spatial_curl.o: cpp-engine/spatial/curl.cpp
	@echo "Compiling $<..."
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) -c $< -o $@

$(CLI_BUILD_DIR)/cpp-engine_spatial_divergence.o: cpp-engine/spatial/divergence.cpp
	@echo "Compiling $<..."
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) -c $< -o $@

$(CLI_BUILD_DIR)/cpp-engine_spatial_spatialEngine.o: cpp-engine/spatial/spatialEngine.cpp
	@echo "Compiling $<..."
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) -c $< -o $@

$(CLI_BUILD_DIR)/cpp-engine_spatial_streamline.o: cpp-engine/spatial/streamline.cpp
	@echo "Compiling $<..."
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) -c $< -o $@

$(CLI_BUILD_DIR)/cpp-engine_spatial_Theorems.o: cpp-engine/spatial/Theorems.cpp
	@echo "Compiling $<..."
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) -c $< -o $@

$(CLI_BUILD_DIR)/cpp-engine_math_vector_math.o: cpp-engine/math/vector_math.cpp
	@echo "Compiling $<..."
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) -c $< -o $@

# --- WebAssembly ---
wasm: ensure-dirs $(WASM_TARGET)
	@echo "$(GREEN)✓ WebAssembly build complete!$(NC)"

$(WASM_TARGET): $(WASM_OBJS)
	@echo "Linking WebAssembly module..."
	$(WASM_CXX) $(WASM_CXXFLAGS) $(WASM_OBJS) -o $(WASM_TARGET) $(WASM_LDFLAGS)
	@echo "$(GREEN)✓ Created $(WASM_TARGET)$(NC)"

$(WASM_BUILD_DIR)/cpp-engine_math_vector_math.o: cpp-engine/math/vector_math.cpp
	$(WASM_CXX) $(WASM_CXXFLAGS) -c $< -o $@

$(WASM_BUILD_DIR)/cpp-engine_spatial_spatialEngine.o: cpp-engine/spatial/spatialEngine.cpp
	$(WASM_CXX) $(WASM_CXXFLAGS) -c $< -o $@

$(WASM_BUILD_DIR)/cpp-engine_spatial_curl.o: cpp-engine/spatial/curl.cpp
	$(WASM_CXX) $(WASM_CXXFLAGS) -c $< -o $@

$(WASM_BUILD_DIR)/cpp-engine_spatial_divergence.o: cpp-engine/spatial/divergence.cpp
	$(WASM_CXX) $(WASM_CXXFLAGS) -c $< -o $@

$(WASM_BUILD_DIR)/cpp-engine_spatial_streamline.o: cpp-engine/spatial/streamline.cpp
	$(WASM_CXX) $(WASM_CXXFLAGS) -c $< -o $@

$(WASM_BUILD_DIR)/cpp-engine_spatial_Theorems.o: cpp-engine/spatial/Theorems.cpp
	$(WASM_CXX) $(WASM_CXXFLAGS) -c $< -o $@

$(WASM_BUILD_DIR)/cpp-engine_time_domain_ACCircuitEngine.o: cpp-engine/time_domain/ACCircuitEngine.cpp
	$(WASM_CXX) $(WASM_CXXFLAGS) -c $< -o $@

$(WASM_BUILD_DIR)/cpp-engine_time_domain_WaveEngine.o: cpp-engine/time_domain/WaveEngine.cpp
	$(WASM_CXX) $(WASM_CXXFLAGS) -c $< -o $@

$(WASM_BUILD_DIR)/cpp-engine_bindings_mathlab_x.o: cpp-engine/bindings/mathlab_x.cpp
	$(WASM_CXX) $(WASM_CXXFLAGS) -c $< -o $@

# ============================================================================
# Directory setup
# ============================================================================
ensure-dirs:
	@mkdir -p $(CLI_BUILD_DIR)
	@mkdir -p $(WASM_BUILD_DIR)
	@mkdir -p wasm
	@mkdir -p logs

# ============================================================================
# Clean
# ============================================================================
clean: clean-cli clean-wasm
	@echo "$(GREEN)✓ Full clean complete$(NC)"

clean-cli:
	@echo "Cleaning CLI build..."
	rm -rf $(CLI_BUILD_DIR)
	rm -f $(CLI_TARGET)
	@echo "$(GREEN)✓ CLI clean complete$(NC)"

clean-wasm:
	@echo "Cleaning WebAssembly build..."
	rm -rf $(WASM_BUILD_DIR)
	rm -rf wasm
	@echo "$(GREEN)✓ WASM clean complete$(NC)"

# ============================================================================
# Run
# ============================================================================
run: cli
	@echo "$(GREEN)Running CLI...$(NC)"
	@echo "================================"
	./$(CLI_TARGET)

# ============================================================================
# Dev builds
# ============================================================================
debug-cli: CLI_CXXFLAGS += -g -DDEBUG
debug-cli: clean-cli cli

debug-wasm: WASM_CXXFLAGS += -g -s ASSERTIONS=2 -s SAFE_HEAP=1
debug-wasm: clean-wasm wasm

prod-wasm: WASM_CXXFLAGS = -Oz -std=c++17 -Wall \
           -Icpp-engine/math \
           -Icpp-engine/spatial \
           -Icpp-engine/time_domain \
           -Icpp-engine/bindings
prod-wasm: WASM_LDFLAGS += -s AGGRESSIVE_VARIABLE_ELIMINATION=1
prod-wasm: clean-wasm wasm

# Single-command compile (bypass make's object tracking entirely)
fast-cli:
	@echo "$(GREEN)Fast CLI build...$(NC)"
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) $(CLI_SRCS) -o $(CLI_TARGET)
	@echo "$(GREEN)✓ Fast build complete - run with: ./$(CLI_TARGET)$(NC)"

# ============================================================================
# Help
# ============================================================================
help:
	@echo "$(BLUE)MathlabX Makefile Commands$(NC)"
	@echo "====================================="
	@echo ""
	@echo "$(YELLOW)Native CLI:$(NC)"
	@echo "  make cli        - Build native CLI"
	@echo "  make run        - Build and run"
	@echo "  make fast-cli   - Quick single-command build"
	@echo "  make debug-cli  - Build with debug symbols"
	@echo "  make clean-cli  - Clean CLI artifacts"
	@echo ""
	@echo "$(YELLOW)WebAssembly:$(NC)"
	@echo "  make wasm       - Build WASM module"
	@echo "  make debug-wasm - Build WASM with debug"
	@echo "  make prod-wasm  - Optimized production WASM"
	@echo "  make clean-wasm - Clean WASM artifacts"
	@echo ""
	@echo "$(YELLOW)General:$(NC)"
	@echo "  make all        - Build CLI + WASM"
	@echo "  make clean      - Clean everything"
	@echo "  make help       - This message"
	@echo ""
	@echo "$(GREEN)Quick start: make cli && make run$(NC)"