#include "FrequencyResponseEngine.h"
#include <cmath>
#include <algorithm>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

FrequencyResponseEngine::FrequencyResponseEngine(double start, double end, int numSamples)
    : ACCircuitEngine(start, end, numSamples) {}

void FrequencyResponseEngine::sweepFrequency(double startHz, double endHz, int points) {
    response.clear();
    response.reserve(points);

    double logStart = std::log10(std::max(0.1, startHz));
    double logEnd = std::log10(std::max(1.0, endHz));
    double step = (logEnd - logStart) / (points - 1);

    for (int i = 0; i < points; ++i) {
        double freq = std::pow(10, logStart + i * step);
        
        // Use setSource to update internal state
        // We use Vm=1.0 for sweep to get normalized gain
        setSource(1.0, freq);
        
        double Z = getImpedance();
        
        // Transfer function H = V_out / V_in
        // For series RLC, let's say V_out is across R (Bandpass)
        double gain = (Z > 0) ? (R / Z) : 0.0;
        
        double gain_db = 20.0 * std::log10(std::max(1e-6, gain));
        double phase_deg = -getPhaseAngle() * 180.0 / M_PI;

        response.push_back({freq, gain_db, phase_deg});
    }
}

std::vector<FrequencyPoint> FrequencyResponseEngine::getResponse() const {
    return response;
}

double FrequencyResponseEngine::getResonantFrequency() const {
    if (L <= 0 || C <= 0) return 0;
    return 1.0 / (2.0 * M_PI * std::sqrt(L * C));
}

double FrequencyResponseEngine::getBandwidth() const {
    if (L <= 0) return 0;
    return R / (2.0 * M_PI * L);
}

double FrequencyResponseEngine::getQualityFactor() const {
    double fr = getResonantFrequency();
    double bw = getBandwidth();
    if (bw <= 0) return 0;
    return fr / bw;
}
