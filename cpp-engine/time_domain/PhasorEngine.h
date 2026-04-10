#ifndef PHASOR_ENGINE_H
#define PHASOR_ENGINE_H

#include <cmath>
#include "../time_domain/ACCircuitEngine.h"
#include "../math/complex_math.h"

#ifndef M_PI_2
#define M_PI_2 1.57079632679489661923
#endif

/**
 * PhasorEngine — Specialization for vector/phasor diagrams.
 * Extends ACCircuitEngine to provide vector coordinates for VR, VL, VC, and IT.
 */
class PhasorEngine : public ACCircuitEngine {
public:
    PhasorEngine(double start = 0.0, double end = 0.05, int numSamples = 800)
        : ACCircuitEngine(start, end, numSamples) {}

    /**
     * Get the Source Voltage Phasor (V = Vm ∠ 0)
     */
    Complex getVSourcePhasor() const {
        return Complex(Vm, 0);
    }

    /**
     * Get the VR phasor (Voltage across resistor)
     */
    Complex getVRPhasor(double res, double l, double c, double vm, double f) {
        setCircuitParameters(res, l, c);
        setSource(vm, f);
        double im = getCurrentAmplitude();
        double phi = getPhaseAngle();
        // Current lags voltage by phi, VR is in phase with current
        return Complex::fromPolar(im * res, -phi);
    }

    /**
     * Get the VL phasor (Voltage across inductor)
     */
    Complex getVLPhasor(double res, double l, double c, double vm, double f) {
        setCircuitParameters(res, l, c);
        setSource(vm, f);
        double im = getCurrentAmplitude();
        double phi = getPhaseAngle();
        double xl = getInductiveReactance();
        // VL leads current by 90 degrees (pi/2)
        return Complex::fromPolar(im * xl, M_PI_2 - phi);
    }

    /**
     * Get the VC phasor (Voltage across capacitor)
     */
    Complex getVCPhasor(double res, double l, double c, double vm, double f) {
        setCircuitParameters(res, l, c);
        setSource(vm, f);
        double im = getCurrentAmplitude();
        double phi = getPhaseAngle();
        double xc = getCapacitiveReactance();
        // VC lags current by 90 degrees (-pi/2)
        return Complex::fromPolar(im * xc, -M_PI_2 - phi);
    }
};

#endif // PHASOR_ENGINE_H
