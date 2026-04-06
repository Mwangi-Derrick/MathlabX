#include "ACCircuitEngine.h"
#include "WaveEngine.h"
#include <cmath>
#include <vector>
#include <corecrt_math_defines.h>
#define _USE_MATH_DEFINES // Required for MSVC/Windows

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