#include "divergence.h"
#include "spatialEngine.h"
#include "../math/vector_math.h"
#include <cmath>

// DivergenceEngine2D Implementation
DivergenceEngine2D::DivergenceEngine2D(int rx, int ry, 
                                       double xmin, double xmax,
                                       double ymin, double ymax) 
    : SpatialFieldEngine2D(rx, ry, xmin, xmax, ymin, ymax) {}

void DivergenceEngine2D::computeDivergence() {
    for (int iy = 1; iy < resY - 1; ++iy) {
        for (int ix = 1; ix < resX - 1; ++ix) {
            int idx = iy * resX + ix;
            grid[idx].divergence = VectorMath::divergence2D(
                grid[iy * resX + (ix - 1)], 
                grid[iy * resX + (ix + 1)],
                grid[(iy - 1) * resX + ix], 
                grid[(iy + 1) * resX + ix], 
                dx, dy
            );
        }
    }
}

void DivergenceEngine2D::compute() {
    generateGrid();
    computeDivergence();
}

// DivergenceEngine3D Implementation
DivergenceEngine3D::DivergenceEngine3D(int rx, int ry, int rz,
                                       double xmin, double xmax,
                                       double ymin, double ymax,
                                       double zmin, double zmax) 
    : SpatialFieldEngine3D(rx, ry, rz, xmin, xmax, ymin, ymax, zmin, zmax) {}

void DivergenceEngine3D::computeDivergence() {
    for (int iz = 1; iz < resZ - 1; ++iz) {
        for (int iy = 1; iy < resY - 1; ++iy) {
            for (int ix = 1; ix < resX - 1; ++ix) {
                int idx = iz * resX * resY + iy * resX + ix;
                auto& pX = grid[iz * resX * resY + iy * resX + (ix - 1)];
                auto& nX = grid[iz * resX * resY + iy * resX + (ix + 1)];
                auto& pY = grid[iz * resX * resY + (iy - 1) * resX + ix];
                auto& nY = grid[iz * resX * resY + (iy + 1) * resX + ix];
                auto& pZ = grid[(iz - 1) * resX * resY + iy * resX + ix];
                auto& nZ = grid[(iz + 1) * resX * resY + iy * resX + ix];
                
                grid[idx].divergence = VectorMath::divergence3D(pX, nX, pY, nY, pZ, nZ, dx, dy, dz);
            }
        }
    }
}

void DivergenceEngine3D::compute() {
    generateGrid();
    computeDivergence();
}