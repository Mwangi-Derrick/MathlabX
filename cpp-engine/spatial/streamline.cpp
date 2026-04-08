#include "streamline.h"
#include <cmath>
#include <algorithm>

StreamlineTracer::StreamlineTracer(int rx, int ry,
                                   double xmin, double xmax,
                                   double ymin, double ymax)
    : SpatialFieldEngine2D(rx, ry, xmin, xmax, ymin, ymax) {}

Point2D StreamlineTracer::rk4Step(const Point2D& p, double h) const {
    auto get_field = [&](double x, double y) -> Point2D {
        double fx, fy;
        evaluateField(x, y, fx, fy);
        double mag = std::sqrt(fx * fx + fy * fy);
        if (mag < 1e-10) return {0, 0};
        return {fx / mag, fy / mag};
    };

    Point2D k1 = get_field(p.x, p.y);
    Point2D k2 = get_field(p.x + 0.5 * h * k1.x, p.y + 0.5 * h * k1.y);
    Point2D k3 = get_field(p.x + 0.5 * h * k2.x, p.y + 0.5 * h * k2.y);
    Point2D k4 = get_field(p.x + h * k3.x, p.y + h * k3.y);

    return {
        p.x + (h / 6.0) * (k1.x + 2.0 * k2.x + 2.0 * k3.x + k4.x),
        p.y + (h / 6.0) * (k1.y + 2.0 * k2.y + 2.0 * k3.y + k4.y)
    };
}

std::vector<Point2D> StreamlineTracer::traceFromSeed(double x0, double y0, double stepSize, int maxSteps) {
    std::vector<Point2D> line;
    line.push_back({x0, y0});

    // Forward trace
    Point2D current = {x0, y0};
    for (int i = 0; i < maxSteps; ++i) {
        current = rk4Step(current, stepSize);
        if (current.x < xMin || current.x > xMax || current.y < yMin || current.y > yMax) break;
        
        // Safety: if field is zero, stop
        double fx, fy;
        evaluateField(current.x, current.y, fx, fy);
        if (std::sqrt(fx*fx + fy*fy) < 1e-5) break;
        
        line.push_back(current);
    }

    // Backward trace (prepend to line)
    current = {x0, y0};
    for (int i = 0; i < maxSteps; ++i) {
        current = rk4Step(current, -stepSize);
        if (current.x < xMin || current.x > xMax || current.y < yMin || current.y > yMax) break;

        double fx, fy;
        evaluateField(current.x, current.y, fx, fy);
        if (std::sqrt(fx*fx + fy*fy) < 1e-5) break;

        line.insert(line.begin(), current);
    }

    return line;
}

std::vector<std::vector<Point2D>> StreamlineTracer::traceGrid(int numSeeds, double stepSize, int maxSteps) {
    std::vector<std::vector<Point2D>> streamlines;
    
    // Distribute seeds evenly in the domain
    int count = std::max(1, (int)std::sqrt(numSeeds));
    double dx_seed = (xMax - xMin) / (count + 1);
    double dy_seed = (yMax - yMin) / (count + 1);

    for (int iy = 1; iy <= count; ++iy) {
        for (int ix = 1; ix <= count; ++ix) {
            double sx = xMin + ix * dx_seed;
            double sy = yMin + iy * dy_seed;
            streamlines.push_back(traceFromSeed(sx, sy, stepSize, maxSteps));
        }
    }

    return streamlines;
}
