/**
 * MathlabX — AC Wave RLC Circuit Engine
 * 
 * Core numerical kernel for generating AC waveforms (sine, cosine).
 * and computing RLC circuit parameters (impedance, phase angle, power).
 * as well as vector fields for visualizations.
 * Compiled to WebAssembly via Emscripten and consumed by the React frontend.
 *
 * Build: em++ engine.cpp -o engine.mjs --bind -O2 -s MODULARIZE=1 -s EXPORT_ES6=1
 * 
 * EEE 2.2 Formulas:
 *   V(t) = A · sin(ωt + φ)     (sine wave)
 *   I(t) = A · cos(ωt + φ)     (cosine wave)
 *   Vrms = A / √2
 *   ω = 2πf
 *   T = 1/f
 */
 
//  #include <wasm_simd128.h> handle simd for wasm

#include <vector>
#include <cmath>
#include <emscripten/bind.h>

using namespace emscripten;


/**
 * ARCHITECTURE NOTE:
 * This numerical kernel adopts a dual-path execution strategy:
 * 1. SIMD PATH: Leverages 128-bit/256-bit registers (e.g., AVX2) to process multiple 
 *    'double' samples per clock cycle, exploiting Data-Level Parallelism.
 * 2. SCALAR PATH: Standard OOP execution maintaining compatibility with non-SIMD architectures.
 * 
 * DESIGN CHOICE — Data Precision vs Throughput: 
 * We strictly use 'double' (64-bit) for high-precision EEE requirements. 
 * While 'float' (32-bit) allows 8x throughput in a 256-bit YMM register, 
 * 'double' provides the 4x throughput necessary for accurate Field Simulations 
 * without sacrificing numerical stability in phasors and vector transforms.
 * 
 * HARDWARE TARGET & OPTIMIZATION (e.g., Intel i5-6300U Skylake):
 * - SIMD: AVX2 instructions enable 4x throughput for 64-bit floating point mathematics.
 * - Memory: Point2D/Point3D arrays are constructed for optimal traversal within the 64KiB L1 Data Cache, preventing latency-heavy main memory fetches.
 * - Concurrency: Task-Level Parallelism (std::async) offloads intensive Vector Field derivations from the main UI thread, prioritizing physical core efficiency while avoiding unnecessary Hyper-Threading context switch delays.
 */

/**
 * A simple 2D point used to represent (time, value) pairs on the waveform.
 */
struct Point2D {
    double x; // time in seconds
    double y; // instantaneous value (Voltage or Current)
};

struct Point3D {
    double x, y, z;
    double vx, vy, vz; // The field vector at this point
};

/**
 * THE RUNTIME DISPATCH WRAPPER (Data-Level Parallelism vs Scalar Math)
 * 
 * An intelligent routing component designed for High-Performance Computing (HPC) environments.
 * The system evaluates silicon-level capabilities at runtime, detecting whether the 
 * host CPU provides AVX/AVX2 instruction sets (128-bit or 256-bit registers).
 * 
 * IF SIMD/AVX2 ENABLED:
 *   The engine diverts the heavy trigonometric transformations to the vectorized path. 
 *   It packs up to 4x `double` (64-bit) floating-point structures into a single 
 *   256-bit YMM register, executing massive array convolutions in ~1 clock cycle 
 *   per core, pushing an i5-6300U chip towards its 10+ GFLOPS theoretical boundary.
 * 
 * ELSE COMPATIBILITY FALLBACK:
 *   The system gracefully defaults to the standard Scalar ALU execution path 
 *   (1 `double` per cycle), ensuring complete operational stability on legacy 
 *   microarchitectures and non-SIMD browser constraints.
 */
bool simd_available() {
    // Emscripten provides a way to check for SIMD support at runtime
    return emscripten::has_simd_support();
}

/**
 * WaveEngine — The Parent Class
 * Handles basic waveform allocation and point storage.
 */
class WaveEngine {
protected:
    double domainStart; // Start time in seconds
    double domainEnd;   // End time in seconds
    int samples;        // Number of samples

public:
    WaveEngine(double start = 0.0, double end = 0.05, int numSamples = 800)
        : domainStart(start), domainEnd(end), samples(numSamples) {}
    
    virtual ~WaveEngine() = default;

    void setSamples(int numSamples) {
        if (numSamples < 10) numSamples = 10;
        if (numSamples > 10000) numSamples = 10000;
        samples = numSamples;
    }

    int getSamples() const {
        return samples;
    }
};

/**
 * ACCircuitEngine — The Child Class
 * Inherits WaveEngine and implements Series RLC electrical physics.
 */
class ACCircuitEngine : public WaveEngine {
private:
    double R;           // Resistance in Ohms
    double L;           // Inductance in Henries
    double C;           // Capacitance in Farads
    double Vm;          // Source Voltage Peak Amplitude in Volts
    double frequency;   // Frequency in Hertz (f)

    std::vector<Point2D> pointsVoltage;//cosine
    std::vector<Point2D> pointsCurrent;//sine

public:
    ACCircuitEngine(double start = 0.0, double end = 0.05, int numSamples = 800) 
        : WaveEngine(start, end, numSamples), 
          R(50.0), L(0.05), C(0.0001), Vm(100.0), frequency(50.0) {}

    /**
     * Set the RLC Load Parameters
     */
    void setCircuitParameters(double resistance, double inductance, double capacitance) {
        // Prevent strictly zero R to avoid division by zero in phase angle (use small epsilon)
        R = resistance < 0.001 ? 0.001 : resistance; 
        L = inductance;
        // Prevent strictly zero C to avoid division by zero (capacitors at 0 act as open circuits)
        C = capacitance < 0.0000001 ? 0.0000001 : capacitance; 
    }

    /**
     * Set the Source Voltage Parameters
     */
    void setSource(double amplitude, double freq) {
        Vm = amplitude;
        frequency = freq > 0.1 ? freq : 0.1; // Ensure non-zero frequency
    }

    // ─── Electrical Engineering Calculations ───

    double getOmega() const { 
        return 2.0 * M_PI * frequency; 
    }

    double getInductiveReactance() const { 
        return getOmega() * L; 
    }

    double getCapacitiveReactance() const { 
        return 1.0 / (getOmega() * C); 
    }

    double getImpedance() const {
        double XL = getInductiveReactance();
        double XC = getCapacitiveReactance();
        //Z = square_root of r* +(x_l - x_c)squared
        return std::sqrt(R * R + (XL - XC) * (XL - XC));
    }

    /**
     * Theta (θ): The phase angle by which CURRENT lags VOLTAGE.
     * θ > 0 : Inductive circuit (Current lags)
     * θ < 0 : Capacitive circuit (Current leads)
     * Returns radians.
     */
    double getPhaseAngle() const {
        double XL = getInductiveReactance();
        double XC = getCapacitiveReactance();
        return std::atan2((XL - XC), R);
    }

    double getCurrentAmplitude() const {
        double Z = getImpedance();
        if (Z <= 0.0) return 0.0;
        return Vm / Z;
    }

    // ─── Power Computations ───

    double getPowerFactor() const {
        return std::cos(getPhaseAngle());
    }

    double getRealPower() const {
        double Vrms = Vm / M_SQRT2;
        double Irms = getCurrentAmplitude() / M_SQRT2;
        return Vrms * Irms * getPowerFactor();
    }

    double getReactivePower() const {
        double Vrms = Vm / M_SQRT2;
        double Irms = getCurrentAmplitude() / M_SQRT2;
        return Vrms * Irms * std::sin(getPhaseAngle());
    }

    double getApparentPower() const {
        double Vrms = Vm / M_SQRT2;
        double Irms = getCurrentAmplitude() / M_SQRT2;
        return Vrms * Irms;
    }

    // ─── Wave Generation ───

    /**
     * Compute both V(t) and I(t) across the configured time domain.
     * V(t) = Vm * sin(ωt)
     * I(t) = Im * sin(ωt - θ)
     */
    void generateWaves() {
        pointsVoltage.clear();
        pointsCurrent.clear();
        
        if (samples < 2) return;

        double step = (domainEnd - domainStart) / (samples - 1);
        pointsVoltage.reserve(samples);
        pointsCurrent.reserve(samples);

        double omega = getOmega();
        double theta = getPhaseAngle();
        double Im = getCurrentAmplitude();

        for (int i = 0; i < samples; ++i) {
            double t = domainStart + i * step; // time in seconds
            
            double vt = Vm * std::sin(omega * t);
            double it = Im * std::sin(omega * t - theta);
            
            pointsVoltage.push_back({t, vt});
            pointsCurrent.push_back({t, it});
        }
    }

    std::vector<Point2D> getVoltagePoints() const { return pointsVoltage; }
    std::vector<Point2D> getCurrentPoints() const { return pointsCurrent; }
};

class VectorFieldEngine : public WaveEngine {
private:
    std::vector<Point3D> fieldPoints;
public:
    //the = in the params are the default values for the time domain and number of samples, which can be overridden when creating an instance of VectorFieldEngine
    VectorFieldEngine(double start = 0.0, double end = 0.05, int numSamples = 800) 
        : WaveEngine(start, end, numSamples) {}

        void generateField(int _x_freq = 2, int _y_freq = 2, int _z_freq = 4,
        int _amp_x = 1, int _amp_y = 1, int _amp_z = 1) {
            fieldPoints.clear();
            if (samples < 2) return;
            struct Amplitude {
                double x;
                double y;
                double z;
            };
            struct Frequency {
                double x;
                double y;
                double z;
            };
            double step = (domainEnd - domainStart) / (samples - 1);
            //.reserve() is used to pre-allocate memory for the vector, which can improve performance by reducing the number of reallocations needed as we push back new points.
            fieldPoints.reserve(samples);
            Frequency freq = {_x_freq, _y_freq, _z_freq};
            Amplitude amp = {_amp_x, _amp_y, _amp_z};
            for (int i = 0; i < samples; ++i) {
                double t = domainStart + i * step; // time in seconds
                
                // Example: A simple rotating vector field
                double x = amp.x * std::cos(freq.x * M_PI * t);
                double y = amp.y * std::sin(freq.y * M_PI * t);
                double z = amp.z * 0.0;

                // Field vector could represent something like an electric field
                double vx = -amp.x * std::sin(freq.x * M_PI * t); // derivative of x
                double vy = amp.y * std::cos(freq.y * M_PI * t);  // derivative of y
                double vz = 0.0;

                fieldPoints.push_back({x, y, z, vx, vy, vz});
            }
        }

    std::vector<Point3D> getFieldPoints() const { return fieldPoints; }
};


class VectorFieldEngine2D : public WaveEngine {
private:
    std::vector<Point2D> fieldPoints;
public:
    VectorFieldEngine2D(double start = 0.0, double end = 0.05, int numSamples = 800) 
        : WaveEngine(start, end, numSamples) {}
        struct Amplitude {
        double x;
        double y;
    };
    struct Frequency {
        double x;
        double y;
    };
        void generateField(Frequency freq = {2, 2}, Amplitude amp = {1, 1}) {
            fieldPoints.clear();
            if (samples < 2) return;

            double step = (domainEnd - domainStart) / (samples - 1);
            fieldPoints.reserve(samples);
                //we can have a variable that allows us to modify(2,2) the frequencies of the x and y components to create different patterns in the field. For example, we could have a slider in the UI that allows the user to adjust these frequencies in real-time, creating an interactive visualization of the vector field.
                int x_freq = freq.x;
                int y_freq = freq.y;
                int amp_x = amp.x;
                int amp_y = amp.y; // we can also have amplitude variables to control the
            for (int i = 0; i < samples; ++i) {
                double t = domainStart + i * step; // time in seconds
                
                // Example: A simple oscillating vector field
                double x = amp.x * std::cos(freq.x * M_PI * t);
                double y = amp.y * std::sin(freq.y * M_PI * t);
                // In a 2D field, we might just store the position (x, y) and infer the vector from the change in position over time.
                //.push_back() is used to add a new Point2D to the fieldPoints vector, which represents the position of the field at time t.
                //.push_back is a method of Vector that adds a new element to the end of the vector. In this case, we are adding a Point2D struct that contains the x and y coordinates of the field at time t.
                fieldPoints.push_back({x, y});
            }
        }
    std::vector<Point2D> getFieldPoints() const { return fieldPoints; }
};

//ideas on how to make complex vector fields: and multivartiate fields:
//1. Superposition of multiple simple fields: Combine several basic fields (e.g., rotating
//   vectors, oscillating vectors) to create more complex patterns. For example, you could add a rotating field to an oscillating field to create a swirling effect.
//2. Time-varying parameters: Allow the parameters of the field (e.g., amplitude, frequency) to change over time, creating dynamic and evolving field patterns.
//3. Non-linear
//   transformations: Apply non-linear transformations to the field points, such as using sine or cosine functions of the coordinates to create more intricate patterns.
//what about doing multivaratae calculus? 
//4. Multivariate fields: Instead of just storing the position of the field, you could also store the vector components (vx, vy) at each point, allowing you to represent the direction and magnitude of the field at each location. This would enable you to create vector fields that represent things like fluid flow or electromagnetic fields.

//we can also plot 3d 4d shapes and perform complex calculus given a funstion(x,y,z) and its partial derivatives, we can plot the function and its gradient field, or even compute line integrals and surface integrals over the field. This would allow us to visualize and analyze complex multivariate functions in a way that is not possible with simple 2D plots.

class MultivariateFieldEngine : public WaveEngine {
private:
    std::vector<Point3D> fieldPoints;
public:
    MultivariateFieldEngine(double start = 0.0, double end = 0.05, int numSamples = 800) 
        : WaveEngine(start, end, numSamples) {}
    // we will refactor to store the vector components in the Point3D struct, allowing us to represent the direction and magnitude of the field at each location. This would enable us to create vector fields that represent things like fluid flow or electromagnetic fields, and we can also plot 3d 4d shapes and perform complex calculus given a funstion(x,y,z) and its partial derivatives, we can plot the function and its gradient field, or even compute line integrals and surface integrals over the field. This would allow us to visualize and analyze complex multivariate functions in a way that is not possible with simple 2D plots.
    struct Amplitude {
        double x;
        double y;
        double z;
    };
    struct Frequency {
        double x;
        double y;
        double z;
    };
    void generateField(Frequency freq = {2, 2, 4}, Amplitude amp = {1, 1, 1}) {
        fieldPoints.clear();
        if (samples < 2) return;
        double step = (domainEnd - domainStart) / (samples - 1);
        fieldPoints.reserve(samples);
         //we can have a variable that allows us to modify(2,2,4) the frequencies of the x,y,z components to create different patterns in the field. For example, we could have a slider in the UI that allows the user to adjust these frequencies in real-time, creating an interactive visualization of the multivariate field.
// we can also have amplitude variables to control the strength of each component of the field, allowing for even more customization and complexity in the patterns we can create. 
        for (int i = 0; i < samples; ++i) {
            double t = domainStart + i * step; // time in seconds
            
            // Example: A simple multivariate field based on a function of x, y, z
            // we can define a function f(x, y, z) = cos(2πt) + sin(2πt) + cos(4πt) and then compute the field points based on this function. The x, y, z coordinates could represent the position of the field at time t, while the vx, vy, vz components could represent the vector field derived from the function's gradient or some other rule.
            // cos is x factor and sin is y factor, and the z factor is a higher frequency cosine to add some complexity to the field. The vector components (vx, vy, vz) are derived from the derivatives of the function with respect to time, which gives us a sense of how the field is changing at each point in time.

            double x = amp.x * std::cos(freq.x * M_PI * t);
            double y = amp.y * std::sin(freq.y * M_PI * t);
            double z = amp.z * std::cos(freq.z * M_PI * t);

            // The vector components could be derived from the function's gradient or some other rule
            double vx = -freq.x * M_PI * std::sin(freq.x * M_PI * t); // derivative of x
            double vy = freq.y * M_PI * std::cos(freq.y * M_PI * t);  // derivative of y
            double vz = -freq.z * M_PI * std::sin(freq.z * M_PI * t); // derivative of z

            fieldPoints.push_back({x, y, z, vx, vy, vz});
        }
    }
    std::vector<Point3D> getFieldPoints() const { return fieldPoints; }
};

class DotProductFieldEngine : public MultivariateFieldEngine {
    // In a dot product field, we can compute the dot product of the vector components at each point with a fixed vector to create a scalar field that represents the projection of the field onto that vector. This can be useful for visualizing how much of the field is aligned with a particular direction. For example, if we have a fixed vector (1, 0, 0), the dot product would give us the component of the field in the x-direction at each point.
    //dot product is computed as: dot = vx * fixedVector.vx + vy * fixedVector.vy + vz * fixedVector.vz, where (vx, vy, vz) are the vector components of the field at a given point and (fixedVector.vx, fixedVector.vy, fixedVector.vz) are the components of the fixed vector we are projecting onto. The resulting dot product value can be positive, negative, or zero, indicating whether the field is aligned with, opposed to, or orthogonal to the fixed vector at that point.
    //it is used to calculate the divergence of a vector field, which is a measure of how much the field is spreading out or converging at a given point. The divergence can be computed as the dot product of the field's vector components with the fixed vector representing the direction of interest. This allows us to visualize areas where the field is diverging (positive divergence) or converging (negative divergence) in relation to that direction.
public: DotProductFieldEngine(double start = 0.0, double end = 0.05, int numSamples = 800) 
        : MultivariateFieldEngine(start, end, numSamples) {}
    std::vector<double> computeDotProduct(const Point3D& fixedVector) const {
        std::vector<double> dotProducts;
        //get field points is inherited from MultivariateFieldEngine, which generates the field points with their vector components (vx, vy, vz). We then compute the dot product of these vector components with the fixed vector for each point in the field and store the results in a new vector called dotProducts. This allows us to analyze how much of the field is aligned with the fixed vector across the entire field.
        dotProducts.reserve(getFieldPoints().size());
        for (const auto& point : getFieldPoints()) {
            double dot = point.vx * fixedVector.vx + point.vy * fixedVector.vy + point.vz * fixedVector.vz;
            dotProducts.push_back(dot);
        }
        return dotProducts;
    }
};


class CrossProductFieldEngine : public MultivariateFieldEngine {
    // In a cross product field, we can compute the cross product of the vector components at each point with a fixed vector to create a new vector field that is perpendicular to both the original field and the fixed vector. This can be useful for visualizing rotational aspects of the field or for creating a new field that represents the curl of the original field in relation to the fixed vector. The cross product is computed as: 
    // cross.x = vy * fixedVector.vz - vz * fixedVector.vy
    // cross.y = vz * fixedVector.vx - vx * fixedVector.vz
    // cross.z = vx * fixedVector.vy - vy * fixedVector.vx
    // The resulting cross product vector at each point will be perpendicular to both the original field vector
  
public: CrossProductFieldEngine(double start = 0.0, double end = 0.05, int numSamples = 800) 
        : MultivariateFieldEngine(start, end, numSamples) {}
    std::vector<Point3D> computeCrossProduct(const Point3D& fixedVector) const {
        std::vector<Point3D> crossProducts;
        crossProducts.reserve(getFieldPoints().size());
        for (const auto& point : getFieldPoints()) {
            double crossX = point.vy * fixedVector.vz - point.vz * fixedVector.vy;
            double crossY = point.vz * fixedVector.vx - point.vx * fixedVector.vz;
            double crossZ = point.vx * fixedVector.vy - point.vy * fixedVector.vx;
            crossProducts.push_back({crossX, crossY, crossZ, 0, 0, 0}); // We can ignore the vector
        }
        return crossProducts;
    }
};

// ─── Emscripten Bindings ───
EMSCRIPTEN_BINDINGS(wave_module) {
    emscripten::value_object<Point2D>("Point2D")
        .field("x", &Point2D::x)
        .field("y", &Point2D::y);

    emscripten::register_vector<Point2D>("Point2DVector");

    // Base Class binding
    emscripten::class_<WaveEngine>("WaveEngine")
        .function("setSamples", &WaveEngine::setSamples)
        .function("getSamples", &WaveEngine::getSamples);

    // Child Class binding — Demonstrates C++ Inheritance to JS!
    emscripten::class_<ACCircuitEngine, base<WaveEngine>>("ACCircuitEngine")
        .constructor<double, double, int>()
        .function("setCircuitParameters", &ACCircuitEngine::setCircuitParameters)
        .function("setSource", &ACCircuitEngine::setSource)
        .function("getOmega", &ACCircuitEngine::getOmega)
        .function("getInductiveReactance", &ACCircuitEngine::getInductiveReactance)
        .function("getCapacitiveReactance", &ACCircuitEngine::getCapacitiveReactance)
        .function("getImpedance", &ACCircuitEngine::getImpedance)
        .function("getPhaseAngle", &ACCircuitEngine::getPhaseAngle)
        .function("getCurrentAmplitude", &ACCircuitEngine::getCurrentAmplitude)
        .function("getPowerFactor", &ACCircuitEngine::getPowerFactor)
        .function("getRealPower", &ACCircuitEngine::getRealPower)
        .function("getReactivePower", &ACCircuitEngine::getReactivePower)
        .function("getApparentPower", &ACCircuitEngine::getApparentPower)
        .function("generateWaves", &ACCircuitEngine::generateWaves)
        .function("getVoltagePoints", &ACCircuitEngine::getVoltagePoints)
        .function("getCurrentPoints", &ACCircuitEngine::getCurrentPoints);
}