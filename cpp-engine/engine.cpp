#pragma once
#include <vector>
#include <cmath>
#include <emscripten/bind.h>

using namespace emscripten;

// Struct representing a 2D point (x, y)
struct Point2D {
    double x;
    double y;
};

// Core Wave Engine
class WaveEngine {
private:
    std::vector<Point2D> points;  // This is like your "graph paper" where every dot lives
    double domainStart;            // Left boundary of your x-axis (e.g., -500)
    double domainEnd;              // Right boundary of your x-axis (e.g., 500)
    int samples; //this code represents the number of samples to calculate
public:
    WaveEngine(double start = -500.0, double end = 500.0, int numSamples = 1000)
        : domainStart(start), domainEnd(end), samples(numSamples) {}
    // V = A * sin(2 * pi * f * t + phi) is the general formula for a sine wave, where:
    // Generates a sine wave with given amplitude and frequency 
    void generateSine(double amplitude, double frequency) {
        points.clear();
        //ie if we have 10 samples from -10 to 10 then step will be 20/9 because we want to include both -10 and 10 in our samples
        // a graph paper with a square of 5 boxes has 6 lines (including the borders) so we divide the total length by (samples - 1) to get the step size
        // so domain start to end is 6 lines and we want 5 samples in between those lines, so we divide by (samples - 1) to get the correct step size
        double step = (domainEnd - domainStart) / (samples - 1);
        for (int i = 0; i < samples; i++) {
            double x = domainStart + i * step;
            double y = amplitude * std::sin(frequency * x); // Core sine formula
            points.push_back({x, y});
        }
    }
    //I = A * cos(2 * pi * f * t + phi) is the general formula for a cosine wave, where:
    // I is the instantaneous value of the wave at time t.

    // V = A * sin(2 * pi * f * t + phi) is the general formula for a sine wave, where:
    // V is the instantaneous value of the wave at time t.
    // Generates a cosine wave with given amplitude and frequency
    void generateCosine(double amplitude, double frequency) {
        points.clear();
        double step = (domainEnd - domainStart) / (samples - 1);
        for (int i = 0; i < samples; i++) {
            double x = domainStart + i * step;
            double y = amplitude * std::cos(frequency * x); // Core cosine formula
            points.push_back({x, y});
        }
    }

    // Return all points to JS via emscripten
    std::vector<Point2D> getPoints() const {
        return points;
    }
};

// we are not using int main() because this code is meant to be compiled to WebAssembly and called from JavaScript, so we don't need a traditional entry point.
//emscripten is ffi library that allows us to call C++ code from JavaScript and vice versa. It provides a way to bind C++ classes and functions so they can be used in JavaScript. In this case, we are binding the Point2D struct and the WaveEngine class so that we can create instances of WaveEngine and call its methods from JavaScript.
// Bindings so JS can call these functions
EMSCRIPTEN_BINDINGS(wave_module) {
    emscripten::value_object<Point2D>("Point2D")
        .field("x", &Point2D::x)
        .field("y", &Point2D::y);

    emscripten::register_vector<Point2D>("Point2DVector");

    emscripten::class_<WaveEngine>("WaveEngine")
        .constructor<double, double, int>()
        .function("generateSine", &WaveEngine::generateSine)
        .function("generateCosine", &WaveEngine::generateCosine)
        .function("getPoints", &WaveEngine::getPoints);
}