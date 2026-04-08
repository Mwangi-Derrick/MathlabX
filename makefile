# Makefile for MathlabX - Production Build
EMSDK_PATH = /c/Users/user/emsdk/upstream/emscripten
CXX = $(EMSDK_PATH)/em++.bat

# Optimization flags for production
CXXFLAGS = -O3 -msimd128 -std=c++17 -Wall \
           -Icpp-engine/math \
           -Icpp-engine/spatial \
           -Icpp-engine/time_domain \
           -Icpp-engine/bindings

# WebAssembly specific flags
LDFLAGS = --bind \
          -s MODULARIZE=1 \
          -s EXPORT_ES6=1 \
          -s EXPORT_NAME=createMathlabXModule \
          -s ALLOW_MEMORY_GROWTH=1 \
          -s WASM=1 \
          -s FILESYSTEM=0 \
          -s ASSERTIONS=0

TARGET = wasm/mathlab_x.mjs

# Source files
SRCS = \
    cpp-engine/math/vector_math.cpp \
    cpp-engine/spatial/spatialEngine.cpp \
    cpp-engine/spatial/curl.cpp \
    cpp-engine/spatial/divergence.cpp \
    cpp-engine/spatial/streamline.cpp \
    cpp-engine/spatial/Theorems.cpp \
    cpp-engine/time_domain/ACCircuitEngine.cpp \
    cpp-engine/time_domain/WaveEngine.cpp \
    cpp-engine/bindings/mathlab_x.cpp

OBJS = $(SRCS:.cpp=.o)

.PHONY: all clean ensure_dir

all: ensure_dir $(TARGET)

ensure_dir:
	mkdir -p wasm

$(TARGET): $(OBJS)
	$(CXX) $(CXXFLAGS) $(OBJS) -o $(TARGET) $(LDFLAGS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS)
	rm -rf wasm

# Development build with debugging
debug: CXXFLAGS += -g -s ASSERTIONS=2 -s SAFE_HEAP=1
debug: clean all

# Production build (smaller size)
prod: CXXFLAGS += -Oz
prod: LDFLAGS += -s AGGRESSIVE_VARIABLE_ELIMINATION=1
prod: clean all