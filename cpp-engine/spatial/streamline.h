#ifndef STREAMLINE_H
#define STREAMLINE_H

#include "spatialEngine.h"
#include <vector>

/**
 * StreamlineTracer — Focus on Field Lines (EMAG 1)
 * Inherits from SpatialFieldEngine2D to reuse evaluation logic.
 */
class StreamlineTracer : public SpatialFieldEngine2D {
public:
    StreamlineTracer(int rx = 20, int ry = 20,
                     double xmin = -5.0, double xmax = 5.0,
                     double ymin = -5.0, double ymax = 5.0);

    /**
     * Trace a single streamline from a seed point.
     * Uses RK4 numerical integration.
     */
    std::vector<Point2D> traceFromSeed(double x0, double y0, double stepSize = 0.05, int maxSteps = 500);

    /**
     * Trace multiple streamlines from a set of seeds.
     */
    std::vector<std::vector<Point2D>> traceGrid(int numSeeds, double stepSize = 0.05, int maxSteps = 500);

private:
    /**
     * Perform one RK4 step forward or backward.
     */
    Point2D rk4Step(const Point2D& p, double h) const;
};

#endif // STREAMLINE_H
