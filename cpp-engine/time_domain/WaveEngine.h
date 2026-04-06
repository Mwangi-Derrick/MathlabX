#ifndef WAVE_ENGINE_H
#define WAVE_ENGINE_H

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
    WaveEngine(double start = 0.0, double end = 0.05, int numSamples = 800);
    virtual ~WaveEngine() = default;

    void setSamples(int numSamples);
    int getSamples() const;
};

#endif // WAVE_ENGINE_H