#ifndef COMPLEX_MATH_H
#define COMPLEX_MATH_H

#include <cmath>

/**
 * Complex — A lightweight structure for AC phasor arithmetic.
 * Represents z = real + j*imag (Rectangular)
 * or z = mag ∠ phase (Polar)
 */
struct Complex {
    double real;
    double imag;

    Complex(double r = 0, double i = 0) : real(r), imag(i) {}

    static Complex fromPolar(double mag, double phaseRad) {
        return Complex(mag * std::cos(phaseRad), mag * std::sin(phaseRad));
    }

    double magnitude() const {
        return std::sqrt(real * real + imag * imag);
    }

    double phase() const {
        return std::atan2(imag, real);
    }

    Complex operator+(const Complex& other) const {
        return Complex(real + other.real, imag + other.imag);
    }

    Complex operator-(const Complex& other) const {
        return Complex(real - other.real, imag - other.imag);
    }

    Complex operator*(const Complex& other) const {
        return Complex(real * other.real - imag * other.imag,
                       real * other.imag + imag * other.real);
    }

    Complex operator/(const Complex& other) const {
        double den = other.real * other.real + other.imag * other.imag;
        if (den == 0) return Complex(0, 0);
        return Complex((real * other.real + imag * other.imag) / den,
                       (imag * other.real - real * other.imag) / den);
    }
};

#endif // COMPLEX_MATH_H
