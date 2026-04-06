#ifndef CURL_H
#define CURL_H

#include "spatialEngine.h"

class CurlEngine2D : public SpatialFieldEngine2D {
public:
    CurlEngine2D(int rx = 20, int ry = 20, double xmin = -5.0, double xmax = 5.0, double ymin = -5.0, double ymax = 5.0) 
        : SpatialFieldEngine2D(rx, ry, xmin, xmax, ymin, ymax) {}

    void computeCurl() {
    }

    void compute() {
    }
};


class CurlEngine3D : public SpatialFieldEngine3D {
public:
    CurlEngine3D(int rx = 10, int ry = 10, int rz = 10, double xmin = -5.0, double xmax = 5.0, double ymin = -5.0, double ymax = 5.0, double zmin = -5.0, double zmax = 5.0) 
        : SpatialFieldEngine3D(rx, ry, rz, xmin, xmax, ymin, ymax, zmin, zmax) {}

    void computeCurl() {
    }

    void compute() {
    }
};

#endif // CURL_H

