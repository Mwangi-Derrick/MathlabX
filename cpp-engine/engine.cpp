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
 * We can implement a dual-path execution strategy:
 * 1. SIMD PATH: Utilizes 128-bit/256-bit registers to process multiple 'double' 
 *    samples per clock cycle (Data-Level Parallelism).
 * 2. SCALAR PATH: Standard OOP implementation for compatibility with older 
 *    architectures and non-SIMD browsers.
 * 
 * DESIGN CHOICE: 
 * We use 'double' (64-bit) for high-precision engineering requirements. 
 * While 'float' and 'int' (32-bit) would allow 4x throughput in a 128-bit SIMD register, 
 * 'double' provides the 2x throughput necessary for accurate Field Simulations 
 * without sacrificing numerical stability.
 * 
 * CONCURRENCY:
 * Task-Level Parallelism is handled via std::async to offload heavy 'FieldGeneration' 
 * from the UI thread, ensuring the React frontend remains responsive during 
 * high-sample computations.
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

// we can have a flag that allows users to choose simd or non-simd implementations of the wave generation and field generation functions, allowing them to optimize for performance or compatibility as needed. For example, we could have a boolean parameter in the generateWaves() and generateField() functions that determines whether to use SIMD instructions or not, and then implement both versions of the algorithms accordingly. This would give users the flexibility to choose the best option for their specific use case and hardware capabilities.
//and a wrapper funstion that acpets generic funtion and wraps if in a simd enabled block, and if simd is not available it just runs the function normally, this way we can have a single codebase that can take advantage of simd when available without sacrificing compatibility with older hardware or browsers that do not support simd.
//so when user toggles the simd flag on browser we run smid enabled block or not, and we can also have a fallback mechanism that detects if simd is not available and automatically falls back to the non-simd implementation, ensuring that the application remains functional even on platforms that do not support simd.
//simd will help especially when using many samples for the wave generation and field generation, as it can process multiple data points in parallel, significantly improving performance and allowing for smoother visualizations and more complex computations in real-time. This is particularly beneficial for applications like MathlabX that aim to provide interactive and visually rich experiences for users exploring mathematical concepts.
//also we can use std::thread and std::async to run the wave generation and field generation in parallel, allowing us to take advantage of multi-core processors and further improve performance, especially when generating complex fields or using a large number of samples. This would allow us to keep the UI responsive while performing computationally intensive tasks in the background, enhancing the overall user experience of MathlabX.
// we are using double so it will be slower than using float and int
/*this laptop is a 4-core processor 64bit for normal operation and i think 128 or 256 bit for the smid registers
an int is 32 bits , float is 32 bits, double is 64 bits 
so meaning nromally this laptop if using int and float it will process 2 numbers per cycle
when using double it will process 1 number per cycle
when using simd it will process 4 numbers per cycle for float or int 
and 2 numbers per cycle for double 
cycle here means the frequency of the clock of the processor 
to be accurate we can check the specs of the machine, ie the clock speed/frequency, the number of threads and the SIMD capabilities (number of normal and simd registers)
how do we chec all these specs...i can use bash and run these commands
...tell me?
    1. How to check specs in Bash (Linux/Ubuntu - JKUAT Labs)
    To get the exact hardware details you mentioned, use these commands:
    CPU Architecture & SIMD flags:
    bash
    lscpu
    Use code with caution.

    Look for "Flags". If you see sse, avx, or avx2, your CPU has 128-bit or 256-bit SIMD registers.
    Detailed Processor info:
    bash
    cat /proc/cpuinfo | grep "model name" | uniq
    cat /proc/cpuinfo | grep "flags" | uniq
    Use code with caution.

    Clock Speed (Frequency):
    bash
    watch -n 1 "grep 'cpu MHz' /proc/cpuinfo"
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