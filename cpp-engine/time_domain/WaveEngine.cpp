#include "WaveEngine.h"

// WaveEngine Implementation
WaveEngine::WaveEngine(double start, double end, int numSamples)
    : domainStart(start), domainEnd(end), samples(numSamples) {
    if (samples < 10) samples = 10;
    if (samples > 10000) samples = 10000;
}

void WaveEngine::setSamples(int numSamples) {
    if (numSamples < 10) numSamples = 10;
    if (numSamples > 10000) numSamples = 10000;
    samples = numSamples;
}

int WaveEngine::getSamples() const {
    return samples;
}