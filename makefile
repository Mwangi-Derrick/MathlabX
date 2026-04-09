# Makefile for MathlabX - Supports Native CLI & WebAssembly Builds
# Usage:
#   make cli        - Build native Windows CLI
#   make wasm       - Build WebAssembly module
#   make all        - Build both
#   make clean      - Clean all builds
#   make run        - Run native CLI
#   make help       - Show available commands

# ============================================================================
# Native CLI Configuration (Windows/MinGW)
# ============================================================================
CLI_CXX = g++
CLI_CXXFLAGS = -Wall -std=c++17 -O2
CLI_INCLUDES = -Icpp-engine/math \
               -Icpp-engine/spatial \
               -Icpp-engine/time_domain \
               -I.

CLI_TARGET = cli.exe

CLI_SRCS = cmd/main.cpp \
           cpp-engine/time_domain/ACCircuitEngine.cpp \
           cpp-engine/time_domain/WaveEngine.cpp \
           cpp-engine/spatial/curl.cpp \
           cpp-engine/spatial/divergence.cpp \
           cpp-engine/spatial/spatialEngine.cpp \
           cpp-engine/spatial/streamline.cpp \
           cpp-engine/spatial/Theorems.cpp \
           cpp-engine/math/vector_math.cpp

CLI_OBJS = $(CLI_SRCS:.cpp=.o)

# ============================================================================
# WebAssembly Configuration (Emscripten)
# ============================================================================
EMSDK_PATH = /c/Users/user/emsdk/upstream/emscripten
WASM_CXX = $(EMSDK_PATH)/em++.bat

WASM_CXXFLAGS = -O3 -msimd128 -std=c++17 -Wall \
                -Icpp-engine/math \
                -Icpp-engine/spatial \
                -Icpp-engine/time_domain \
                -Icpp-engine/bindings

WASM_LDFLAGS = --bind \
               -s MODULARIZE=1 \
               -s EXPORT_ES6=1 \
               -s EXPORT_NAME=createMathlabXModule \
               -s ALLOW_MEMORY_GROWTH=1 \
               -s WASM=1 \
               -s FILESYSTEM=0 \
               -s ASSERTIONS=0

WASM_TARGET = wasm/mathlab_x.mjs

WASM_SRCS = cpp-engine/math/vector_math.cpp \
            cpp-engine/spatial/spatialEngine.cpp \
            cpp-engine/spatial/curl.cpp \
            cpp-engine/spatial/divergence.cpp \
            cpp-engine/spatial/streamline.cpp \
            cpp-engine/spatial/Theorems.cpp \
            cpp-engine/time_domain/ACCircuitEngine.cpp \
            cpp-engine/time_domain/WaveEngine.cpp \
            cpp-engine/bindings/mathlab_x.cpp

WASM_OBJS = $(WASM_SRCS:.cpp=.o)

# ============================================================================
# Colors for output
# ============================================================================
GREEN = \033[0;32m
RED = \033[0;31m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m

# ============================================================================
# Phony targets
# ============================================================================
.PHONY: all clean help run debug-cli debug-wasm prod-wasm \
        cli wasm clean-cli clean-wasm ensure-wasm-dir fast-cli

# ============================================================================
# Build targets
# ============================================================================
all: cli wasm
	@echo "$(GREEN)✓ Complete build finished!$(NC)"

# Native CLI targets
cli: $(CLI_TARGET)
	@echo "$(GREEN)✓ CLI build complete!$(NC)"
	@echo "$(YELLOW)You can run it with: make run$(NC)"

$(CLI_TARGET): $(CLI_OBJS)
	@echo "Linking $@..."
	$(CLI_CXX) $(CLI_OBJS) -o $(CLI_TARGET)
	@echo "$(GREEN)✓ Created $(CLI_TARGET)$(NC)"

# Pattern rules for CLI object files
cmd/%.o: cmd/%.cpp
	@echo "Compiling $<..."
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) -c $< -o $@

cpp-engine/time_domain/%.o: cpp-engine/time_domain/%.cpp
	@echo "Compiling $<..."
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) -c $< -o $@

cpp-engine/spatial/%.o: cpp-engine/spatial/%.cpp
	@echo "Compiling $<..."
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) -c $< -o $@

cpp-engine/math/%.o: cpp-engine/math/%.cpp
	@echo "Compiling $<..."
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) -c $< -o $@

# WebAssembly targets
wasm: ensure-wasm-dir $(WASM_TARGET)
	@echo "$(GREEN)✓ WebAssembly build complete!$(NC)"

ensure-wasm-dir:
	@echo "Creating wasm directory..."
	mkdir -p wasm

$(WASM_TARGET): $(WASM_OBJS)
	@echo "Linking WebAssembly module..."
	$(WASM_CXX) $(WASM_CXXFLAGS) $(WASM_OBJS) -o $(WASM_TARGET) $(WASM_LDFLAGS)
	@echo "$(GREEN)✓ Created $(WASM_TARGET)$(NC)"

# Pattern rules for WASM object files
cpp-engine/bindings/%.o: cpp-engine/bindings/%.cpp
	@echo "Compiling WebAssembly bindings..."
	$(WASM_CXX) $(WASM_CXXFLAGS) -c $< -o $@

cpp-engine/math/%.o: cpp-engine/math/%.cpp
	@echo "Compiling WebAssembly math..."
	$(WASM_CXX) $(WASM_CXXFLAGS) -c $< -o $@

cpp-engine/spatial/%.o: cpp-engine/spatial/%.cpp
	@echo "Compiling WebAssembly spatial..."
	$(WASM_CXX) $(WASM_CXXFLAGS) -c $< -o $@

cpp-engine/time_domain/%.o: cpp-engine/time_domain/%.cpp
	@echo "Compiling WebAssembly timedomain..."
	$(WASM_CXX) $(WASM_CXXFLAGS) -c $< -o $@

# ============================================================================
# Clean targets
# ============================================================================
clean: clean-cli clean-wasm
	@echo "$(GREEN)✓ Full clean complete$(NC)"

clean-cli:
	@echo "Cleaning CLI build..."
	rm -f $(CLI_OBJS)
	rm -f $(CLI_TARGET)
	@echo "$(GREEN)✓ CLI clean complete$(NC)"

clean-wasm:
	@echo "Cleaning WebAssembly build..."
	rm -f $(WASM_OBJS)
	rm -rf wasm
	@echo "$(GREEN)✓ WebAssembly clean complete$(NC)"

# ============================================================================
# Run targets
# ============================================================================
run: cli
	@echo "$(GREEN)Running CLI...$(NC)"
	@echo "================================"
	./$(CLI_TARGET)

# ============================================================================
# Development builds
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

# Fast CLI build (single command, no object files)
fast-cli:
	@echo "$(GREEN)Fast CLI build...$(NC)"
	$(CLI_CXX) $(CLI_CXXFLAGS) $(CLI_INCLUDES) $(CLI_SRCS) -o $(CLI_TARGET)
	@echo "$(GREEN)✓ Fast build complete$(NC)"
	@echo "Run with: ./$(CLI_TARGET)"

# ============================================================================
# Help target
# ============================================================================
help:
	@echo "$(BLUE)MathlabX Makefile Commands$(NC)"
	@echo "====================================="
	@echo ""
	@echo "$(YELLOW)Native CLI Targets:$(NC)"
	@echo "  make cli        - Build native Windows CLI"
	@echo "  make run        - Build and run native CLI"
	@echo "  make fast-cli   - Quick CLI build (single command)"
	@echo "  make debug-cli  - Build CLI with debug symbols"
	@echo "  make clean-cli  - Clean CLI build files"
	@echo ""
	@echo "$(YELLOW)WebAssembly Targets:$(NC)"
	@echo "  make wasm       - Build WebAssembly module"
	@echo "  make debug-wasm - Build WASM with debug symbols"
	@echo "  make prod-wasm  - Build optimized production WASM"
	@echo "  make clean-wasm - Clean WebAssembly build files"
	@echo ""
	@echo "$(YELLOW)General Targets:$(NC)"
	@echo "  make all        - Build both CLI and WASM"
	@echo "  make clean      - Clean all builds"
	@echo "  make help       - Show this help message"
	@echo ""
	@echo "$(GREEN)Quick start: make cli && make run$(NC)"