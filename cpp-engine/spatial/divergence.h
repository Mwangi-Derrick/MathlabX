
#ifndef DIVERGENCE_H
#define DIVERGENCE_H

#include "spatialEngine.h"

class DivergenceEngine2D : public SpatialFieldEngine2D {
public:
    DivergenceEngine2D(int rx = 20, int ry = 20, double xmin = -5.0, double xmax = 5.0, double ymin = -5.0, double ymax = 5.0) 
        : SpatialFieldEngine2D(rx, ry, xmin, xmax, ymin, ymax) {}

    void computeDivergence() {
    }

    void compute() {
    }
};


class DivergenceEngine3D : public SpatialFieldEngine3D {
public:
    DivergenceEngine3D(int rx = 10, int ry = 10, int rz = 10, double xmin = -5.0, double xmax = 5.0, double ymin = -5.0, double ymax = 5.0, double zmin = -5.0, double zmax = 5.0) 
        : SpatialFieldEngine3D(rx, ry, rz, xmin, xmax, ymin, ymax, zmin, zmax) {}

    void computeDivergence() {
    }

    void compute() {
    }
};

#endif // DIVERGENCE_H