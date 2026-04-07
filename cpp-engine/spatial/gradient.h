#ifndef GRADIENT_ENGINE_H
#define GRADIENT_ENGINE_H

#include "spatialEngine.h"

/**
 * GradientEngine2D — Computes the gradient (∇f) of a scalar field.
 * In EEE, this converts Voltage (scalar) into Electric Field (vector).
 */
class GradientEngine2D : public SpatialFieldEngine2D {
public:
    GradientEngine2D(int rx = 20, int ry = 20, double xmin = -5.0, double xmax = 5.0, double ymin = -5.0, double ymax = 5.0) 
        : SpatialFieldEngine2D(rx, ry, xmin, xmax, ymin, ymax) {}

    void computeGradient() {
        // Scalar field value is stored temporarily in 'divergence' or another field
        // For now, let's assume we want to compute gradient of a preset function
        for (int iy = 1; iy < resY - 1; ++iy) {
            for (int ix = 1; ix < resX - 1; ++ix) {
                int idx = iy * resX + ix;
                
                // Numerical central difference
                double dV_dx = (grid[iy * resX + (ix + 1)].fx - grid[iy * resX + (ix - 1)].fx) / (2.0 * dx);
                double dV_dy = (grid[(iy + 1) * resX + ix].fx - grid[(iy - 1) * resX + ix].fx) / (2.0 * dy);
                
                // Resulting vector field (fx, fy)
                grid[idx].fx = dV_dx;
                grid[idx].fy = dV_dy;
            }
        }
    }

    void compute() {
        generateGrid();
        computeGradient();
    }
};

#endif // GRADIENT_ENGINE_H
