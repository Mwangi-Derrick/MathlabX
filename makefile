CXX = em++
CXXFLAGS = -O3 -msimd128 -std=c++17 -Wall -Icpp-engine/math -Icpp-engine/spatial -Icpp-engine/time_domain
LDFLAGS = --bind -s MODULARIZE=1 -s EXPORT_ES6=1
TARGET = wasm/mathlab_x.mjs

# Source files across all modules
SRCS = \
    cpp-engine/math/vector_math.cpp \
    cpp-engine/spatial/spatialEngine.cpp \
    cpp-engine/spatial/divergence.cpp \
    cpp-engine/spatial/curl.cpp \
    cpp-engine/time_domain/ACCircuitEngine.cpp \
    cpp-engine/time_domain/WaveEngine.cpp \
    cpp-engine/bindings/mathlab_x.cpp

# Object files
OBJS = $(SRCS:.cpp=.o)

.PHONY: all clean ensure_dir

all: ensure_dir $(TARGET)

ensure_dir:
	@mkdir -p wasm

$(TARGET): $(OBJS)
	$(CXX) $(CXXFLAGS) $(OBJS) -o $(TARGET) $(LDFLAGS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS)
	rm -rf wasm
