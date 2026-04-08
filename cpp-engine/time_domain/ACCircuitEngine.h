#ifndef AC_CIRCUIT_ENGINE_H
#define AC_CIRCUIT_ENGINE_H

#include <vector>
#include <cmath>
#include <algorithm>
#include "WaveEngine.h"
#include "../math/vector_math.h"

/**
 * A simple 2D point used to represent (time, value) pairs on the waveform.
 */
struct Point2D {
    double x; // time in seconds
    double y; // instantaneous value (Voltage or Current)
    
    Point2D(double x_ = 0, double y_ = 0) : x(x_), y(y_) {}
};

struct Point3D {
    double x, y, z;
    double vx, vy, vz; // The field vector at this point
    
    Point3D(double x_ = 0, double y_ = 0, double z_ = 0,
            double vx_ = 0, double vy_ = 0, double vz_ = 0)
        : x(x_), y(y_), z(z_), vx(vx_), vy(vy_), vz(vz_) {}
};

/**
 * ACCircuitEngine — The Child Class
 * Inherits WaveEngine and implements Series RLC electrical physics.
 */
class ACCircuitEngine : public WaveEngine {
protected:
    double R;           // Resistance in Ohms
    double L;           // Inductance in Henries
    double C;           // Capacitance in Farads
    double Vm;          // Source Voltage Peak Amplitude in Volts
    double frequency;   // Frequency in Hertz (f)

    std::vector<Point2D> pointsVoltage; // voltage waveform
    std::vector<Point2D> pointsCurrent; // current waveform

public:
    ACCircuitEngine(double start = 0.0, double end = 0.05, int numSamples = 800);
    ~ACCircuitEngine() = default;

    /**
     * Set the RLC Load Parameters
     */
    void setCircuitParameters(double resistance, double inductance, double capacitance);

    /**
     * Set the Source Voltage Parameters
     */
    void setSource(double amplitude, double freq);

    // ─── Electrical Engineering Calculations ───
    double getOmega() const;
    double getInductiveReactance() const;
    double getCapacitiveReactance() const;
    double getImpedance() const;

    /**
     * Theta (θ): The phase angle by which CURRENT lags VOLTAGE.
     * θ > 0 : Inductive circuit (Current lags)
     * θ < 0 : Capacitive circuit (Current leads)
     * Returns radians.
     */
    double getPhaseAngle() const;
    double getCurrentAmplitude() const;

    // ─── Power Computations ───
    double getPowerFactor() const;
    double getRealPower() const;
    double getReactivePower() const;
    double getApparentPower() const;

    // ─── Wave Generation ───
    /**
     * Compute both V(t) and I(t) across the configured time domain.
     * V(t) = Vm * sin(ωt)
     * I(t) = Im * sin(ωt - θ)
     */
    void generateWaves();

    std::vector<Point2D> getVoltagePoints() const;
    std::vector<Point2D> getCurrentPoints() const;
};

#endif // AC_CIRCUIT_ENGINE_H