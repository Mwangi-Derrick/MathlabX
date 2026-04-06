
#include "WaveEngine.h"
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
