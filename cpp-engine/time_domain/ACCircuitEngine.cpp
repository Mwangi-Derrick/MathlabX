#include "ACCircuitEngine.h"
#include <cmath>
#define _USE_MATH_DEFINES // Required for MSVC/Windows
/* 
 * ACCircuitEngine.cpp
 * Implements the physics and waveform generation for a Series RLC Circuit.
 * 
 * The engine computes the voltage and current waveforms based on the configured
 * circuit parameters (R, L, C) and source characteristics (Vm, frequency).
 * It also provides methods to calculate key electrical engineering metrics such as
 * impedance, phase angle, power factor, and various power components.
 * 
 * The generated waveforms are stored as vectors of Point2D structures, representing
 * time-value pairs for both voltage and current. These can be retrieved for visualization
 * or further analysis.
 */
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif


// ACCircuitEngine Implementation
ACCircuitEngine::ACCircuitEngine(double start, double end, int numSamples)
    : WaveEngine(start, end, numSamples),
      R(50.0), L(0.05), C(0.0001), Vm(100.0), frequency(50.0) {}

void ACCircuitEngine::setCircuitParameters(double resistance, double inductance, double capacitance) {
    R = resistance < 0.001 ? 0.001 : resistance; 
    L = inductance;
    C = capacitance < 0.0000001 ? 0.0000001 : capacitance; 
}

void ACCircuitEngine::setSource(double amplitude, double freq) {
    Vm = amplitude;
    frequency = freq > 0.1 ? freq : 0.1;
}

double ACCircuitEngine::getOmega() const { 
    return 2.0 * M_PI * frequency; 
}

double ACCircuitEngine::getInductiveReactance() const { 
    return getOmega() * L; 
}

double ACCircuitEngine::getCapacitiveReactance() const { 
    return 1.0 / (getOmega() * C); 
}

double ACCircuitEngine::getImpedance() const {
    double XL = getInductiveReactance();
    double XC = getCapacitiveReactance();
    return std::sqrt(R * R + (XL - XC) * (XL - XC));
}

double ACCircuitEngine::getPhaseAngle() const {
    double XL = getInductiveReactance();
    double XC = getCapacitiveReactance();
    return std::atan2((XL - XC), R);
}

double ACCircuitEngine::getCurrentAmplitude() const {
    double Z = getImpedance();
    if (Z <= 0.0) return 0.0;
    return Vm / Z;
}

double ACCircuitEngine::getPowerFactor() const {
    return std::cos(getPhaseAngle());
}

double ACCircuitEngine::getRealPower() const {
    double Vrms = Vm / std::sqrt(2.0);
    double Irms = getCurrentAmplitude() / std::sqrt(2.0);
    return Vrms * Irms * getPowerFactor();
}

double ACCircuitEngine::getReactivePower() const {
    double Vrms = Vm / std::sqrt(2.0);
    double Irms = getCurrentAmplitude() / std::sqrt(2.0);
    return Vrms * Irms * std::sin(getPhaseAngle());
}

double ACCircuitEngine::getApparentPower() const {
    double Vrms = Vm / std::sqrt(2.0);
    double Irms = getCurrentAmplitude() / std::sqrt(2.0);
    return Vrms * Irms;
}

void ACCircuitEngine::generateWaves() {
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
        double t = domainStart + i * step;
        
        double vt = Vm * std::sin(omega * t);
        double it = Im * std::sin(omega * t - theta);
        
        pointsVoltage.emplace_back(t, vt);
        pointsCurrent.emplace_back(t, it);
    }
}

std::vector<Point2D> ACCircuitEngine::getVoltagePoints() const { 
    return pointsVoltage; 
}

std::vector<Point2D> ACCircuitEngine::getCurrentPoints() const { 
    return pointsCurrent; 
}

double ACCircuitEngine::getResonantCapacitance() const {
    double omega = getOmega();
    if (omega <= 0.0 || L <= 0.0) return 0.0001; // Default fallback
    return 1.0 / (omega * omega * L);
}

PhasorState ACCircuitEngine::getPhasorState(double t) const {
    double omega = getOmega();
    double phi = getPhaseAngle();
    double im = getCurrentAmplitude();
    double vs_angle = omega * t;
    double vr_angle = omega * t - phi;
    double vl_angle = omega * t - phi + (M_PI / 2.0);
    double vc_angle = omega * t - phi - (M_PI / 2.0);

    PhasorState state;
    state.vs_real = Vm * std::cos(vs_angle);
    state.vs_imag = Vm * std::sin(vs_angle);
    
    state.vr_real = (im * R) * std::cos(vr_angle);
    state.vr_imag = (im * R) * std::sin(vr_angle);
    
    state.vl_real = (im * getInductiveReactance()) * std::cos(vl_angle);
    state.vl_imag = (im * getInductiveReactance()) * std::sin(vl_angle);
    
    state.vc_real = (im * getCapacitiveReactance()) * std::cos(vc_angle);
    state.vc_imag = (im * getCapacitiveReactance()) * std::sin(vc_angle);
    
    return state;
}