#ifndef FREQUENCY_RESPONSE_ENGINE_H
#define FREQUENCY_RESPONSE_ENGINE_H

#include "ACCircuitEngine.h"
#include <vector>

struct FrequencyPoint {
    double freq;       // Hz
    double gain_db;    // 20*log10(|H(jω)|)
    double phase_deg;  // degrees
};

class FrequencyResponseEngine : public ACCircuitEngine {
private:
    std::vector<FrequencyPoint> response;

public:
    FrequencyResponseEngine(double start = 0.0, double end = 0.05, int numSamples = 800);
    
    void sweepFrequency(double startHz = 1.0, double endHz = 100000.0, int points = 500);
    std::vector<FrequencyPoint> getResponse() const;
    
    double getResonantFrequency() const;
    double getBandwidth() const;
    double getQualityFactor() const;
};

#endif // FREQUENCY_RESPONSE_ENGINE_H
