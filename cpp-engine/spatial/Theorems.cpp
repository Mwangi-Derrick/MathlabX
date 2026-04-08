#include "Theorems.h"
#include <cmath>
#include <algorithm>

TheoremEngine::TheoremEngine(int rx, int ry,
                             double xmin, double xmax,
                             double ymin, double ymax)
    : CurlEngine2D(rx, ry, xmin, xmax, ymin, ymax) {}

double TheoremEngine::computeBoundaryIntegral(double x0, double y0, double x1, double y1) {
    double integral = 0;
    int steps = 100;
    double hx = (x1 - x0) / steps;
    double hy = (y1 - y0) / steps;

    // Bottom (x0 -> x1, y=y0): ∮ P dx
    for (int i = 0; i < steps; ++i) {
        double x = x0 + (i + 0.5) * hx;
        double fx, fy;
        evaluateField(x, y0, fx, fy);
        integral += fx * hx;
    }

    // Right (x=x1, y0 -> y1): ∮ Q dy
    for (int i = 0; i < steps; ++i) {
        double y = y0 + (i + 0.5) * hy;
        double fx, fy;
        evaluateField(x1, y, fx, fy);
        integral += fy * hy;
    }

    // Top (x1 -> x0, y=y1): ∮ P dx  (going backwards)
    for (int i = 0; i < steps; ++i) {
        double x = x1 - (i + 0.5) * hx;
        double fx, fy;
        evaluateField(x, y1, fx, fy);
        integral += fx * (-hx);
    }

    // Left (x=x0, y1 -> y0): ∮ Q dy (going backwards)
    for (int i = 0; i < steps; ++i) {
        double y = y1 - (i + 0.5) * hy;
        double fx, fy;
        evaluateField(x0, y, fx, fy);
        integral += fy * (-hy);
    }

    return integral;
}

double TheoremEngine::computeAreaIntegral(double x0, double y0, double x1, double y1) {
    // Ensure grid and curl are up to date
    compute(); 

    double totalCurl = 0;
    int count = 0;

    for (const auto& pt : grid) {
        if (pt.x >= x0 && pt.x <= x1 && pt.y >= y0 && pt.y <= y1) {
            totalCurl += pt.curl_z;
            count++;
        }
    }

    // The area integral is approximately sum(curl * dA)
    // dA = dx * dy from the grid
    return totalCurl * dx * dy;
}

TheoremResult TheoremEngine::verifyGreensTheorem(double x0, double y0, double x1, double y1) {
    // Canonicalize bounds
    double x_min_req = std::min(x0, x1);
    double x_max_req = std::max(x0, x1);
    double y_min_req = std::min(y0, y1);
    double y_max_req = std::max(y0, y1);

    double line = computeBoundaryIntegral(x_min_req, y_min_req, x_max_req, y_max_req);
    double area = computeAreaIntegral(x_min_req, y_min_req, x_max_req, y_max_req);

    double diff = std::abs(line - area);
    double avg = (std::abs(line) + std::abs(area)) / 2.0;
    bool matches = (avg < 1e-5) ? (diff < 1e-4) : (diff / avg < 0.05); // 5% tolerance

    return { line, area, matches };
}
