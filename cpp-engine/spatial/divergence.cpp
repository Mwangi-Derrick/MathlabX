#include "spatialEngine.h"
#include "../math/vector_math.h"
#include <cmath>
#include <vector>
#include <string>


class DivergenceEngine2D : public SpatialFieldEngine2D {
public:
    DivergenceEngine2D(int rx = 20, int ry = 20, double xmin = -5.0, double xmax = 5.0, double ymin = -5.0, double ymax = 5.0) 
        : SpatialFieldEngine2D(rx, ry, xmin, xmax, ymin, ymax) {}

    void computeDivergence() {
        for (int iy = 1; iy < resY - 1; ++iy) {
            for (int ix = 1; ix < resX - 1; ++ix) {
                int idx = iy * resX + ix;
                grid[idx].divergence = VectorMath::divergence2D(
                    grid[iy*resX + (ix-1)], grid[iy*resX + (ix+1)],
                    grid[(iy-1)*resX + ix], grid[(iy+1)*resX + ix], dx, dy
                );
            }
        }
    }

    void compute() {
        generateGrid();
        computeDivergence();
    }
};


class DivergenceEngine3D : public SpatialFieldEngine3D {
public:
    DivergenceEngine3D(int rx = 10, int ry = 10, int rz = 10, double xmin = -5.0, double xmax = 5.0, double ymin = -5.0, double ymax = 5.0, double zmin = -5.0, double zmax = 5.0) 
        : SpatialFieldEngine3D(rx, ry, rz, xmin, xmax, ymin, ymax, zmin, zmax) {}

    void computeDivergence() {
        for (int iz = 1; iz < resZ - 1; ++iz) {
            for (int iy = 1; iy < resY - 1; ++iy) {
                for (int ix = 1; ix < resX - 1; ++ix) {
                    int idx = iz * resX * resY + iy * resX + ix;
                    auto& pX = grid[iz*resX*resY + iy*resX + (ix-1)];
                    auto& nX = grid[iz*resX*resY + iy*resX + (ix+1)];
                    auto& pY = grid[iz*resX*resY + (iy-1)*resX + ix];
                    auto& nY = grid[iz*resX*resY + (iy+1)*resX + ix];
                    auto& pZ = grid[(iz-1)*resX*resY + iy*resX + ix];
                    auto& nZ = grid[(iz+1)*resX*resY + iy*resX + ix];
                    
                    grid[idx].divergence = VectorMath::divergence3D(pX, nX, pY, nY, pZ, nZ, dx, dy, dz);
                }
            }
        }
    }

    void compute() {
        generateGrid();
        computeDivergence();
    }
};

