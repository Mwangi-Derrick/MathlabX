/**
 * MathlabX — AC Wave Engine
 * 
 * Core numerical kernel for generating AC waveforms (sine, cosine).
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

#include <vector>
#include <cmath>
#include <emscripten/bind.h>

using namespace emscripten;

/**
 * A simple 2D point used to represent (x, y) pairs on the waveform.
 * x = time position along the domain
 * y = voltage/current value at that time
 */
struct Point2D {
    double x;
    double y;
};

/**
 * WaveEngine — the core computation class.
 *
 * Generates sampled waveform data across a configurable domain.
 * All parameters (amplitude, frequency, phase, sample count) are
 * controllable from the JS frontend via Embind.
 *
 * Domain: [domainStart, domainEnd] — the x-axis range to sample over.
 * Samples: how many discrete points to compute across the domain.
 *          More samples = smoother curve, but more computation.
 */
class WaveEngine {
private:
    std::vector<Point2D> points;  // Computed waveform data
    double domainStart;           // Left boundary of x-axis (e.g., -500)
    double domainEnd;             // Right boundary of x-axis (e.g., 500)
    int samples;                  // Number of discrete sample points

public:
    /**
     * Constructor — sets up the sampling domain.
     * @param start  Left boundary of x-axis
     * @param end    Right boundary of x-axis
     * @param numSamples  Number of points to compute (default 1000)
     */
    WaveEngine(double start = -500.0, double end = 500.0, int numSamples = 1000)
        : domainStart(start), domainEnd(end), samples(numSamples) {}

    /**
     * Update the number of sample points without recreating the engine.
     * Called when the "Samples" slider changes in the frontend.
     * @param numSamples  New sample count (clamped to [10, 10000] for safety)
     */
    void setSamples(int numSamples) {
        // Clamp to prevent degenerate cases (too few) or memory blowup (too many)
        if (numSamples < 10) numSamples = 10;
        if (numSamples > 10000) numSamples = 10000;
        samples = numSamples;
    }

    /**
     * Get the current sample count.
     */
    int getSamples() const {
        return samples;
    }

    /**
     * Generate a sine wave: V(t) = A · sin(f · t + φ)
     *
     * @param amplitude  Peak voltage (A) — controlled by the Amplitude slider
     * @param frequency  Angular frequency scaling factor — controlled by the Frequency slider
     * @param phase      Phase offset in radians (φ) — controlled by the Phase slider
     *
     * The step size between samples is (domainEnd - domainStart) / (samples - 1).
     * We divide by (samples - 1) so that both endpoints are included:
     * e.g., 6 points across [0, 5] gives step = 1.0, hitting 0,1,2,3,4,5.
     */
    void generateSine(double amplitude, double frequency, double phase) {
        points.clear();
        if (samples < 2) return;  // Need at least 2 points for a line

        double step = (domainEnd - domainStart) / (samples - 1);
        points.reserve(samples);  // Pre-allocate to avoid repeated reallocation

        for (int i = 0; i < samples; i++) {
            double x = domainStart + i * step;
            double y = amplitude * std::sin(frequency * x + phase);
            points.push_back({x, y});
        }
    }

    /**
     * Generate a cosine wave: I(t) = A · cos(f · t + φ)
     *
     * @param amplitude  Peak value (A)
     * @param frequency  Angular frequency scaling factor
     * @param phase      Phase offset in radians (φ)
     */
    void generateCosine(double amplitude, double frequency, double phase) {
        points.clear();
        if (samples < 2) return;

        double step = (domainEnd - domainStart) / (samples - 1);
        points.reserve(samples);

        for (int i = 0; i < samples; i++) {
            double x = domainStart + i * step;
            double y = amplitude * std::cos(frequency * x + phase);
            points.push_back({x, y});
        }
    }

    /**
     * Return all computed points to JavaScript.
     * Embind's register_vector<Point2D> makes this accessible as a
     * vector with .size() and .get(i) methods on the JS side.
     */
    std::vector<Point2D> getPoints() const {
        return points;
    }

    /**
     * Return the number of computed points (for validation on JS side).
     */
    int getPointCount() const {
        return static_cast<int>(points.size());
    }
};

/**
 * Emscripten Bindings — expose C++ types to JavaScript.
 *
 * This block registers:
 *   - Point2D as a value object (JS gets {x, y} plain objects)
 *   - std::vector<Point2D> as "Point2DVector" (JS gets .size(), .get(i))
 *   - WaveEngine class with all methods
 *
 * On the JS side, usage looks like:
 *   const engine = new Module.WaveEngine(-500, 500, 800);
 *   engine.generateSine(100, 0.02, 0);
 *   const points = engine.getPoints();
 *   for (let i = 0; i < points.size(); i++) {
 *     const p = points.get(i);
 *     console.log(p.x, p.y);
 *   }
 *   engine.delete();  // IMPORTANT: C++ instances must be manually freed
 */
EMSCRIPTEN_BINDINGS(wave_module) {
    // Register Point2D as a value object — JS sees plain {x, y}
    emscripten::value_object<Point2D>("Point2D")
        .field("x", &Point2D::x)
        .field("y", &Point2D::y);

    // Register std::vector<Point2D> so getPoints() return type is usable in JS
    emscripten::register_vector<Point2D>("Point2DVector");

    // Register the WaveEngine class with its constructor and all public methods
    emscripten::class_<WaveEngine>("WaveEngine")
        .constructor<double, double, int>()
        .function("generateSine", &WaveEngine::generateSine)
        .function("generateCosine", &WaveEngine::generateCosine)
        .function("getPoints", &WaveEngine::getPoints)
        .function("setSamples", &WaveEngine::setSamples)
        .function("getSamples", &WaveEngine::getSamples)
        .function("getPointCount", &WaveEngine::getPointCount);
}