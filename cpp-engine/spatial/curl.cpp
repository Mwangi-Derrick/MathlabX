#include "curl.h"
#include "spatialEngine.h"
#include "../math/vector_math.h"
#include <cmath>
#include <vector>

// CurlEngine2D Implementation
CurlEngine2D::CurlEngine2D(int rx, int ry, 
                           double xmin, double xmax,
                           double ymin, double ymax) 
    : SpatialFieldEngine2D(rx, ry, xmin, xmax, ymin, ymax) {}//instantiate the sptial engine with the given parameters
    //the spatail engine retruns varaible grid of type vector<GridPoint2D> which is a struct that contains the coordinates of the grid point and the components of the vector field at the grid point
    //the curl is calculated using the central difference approximation of the curl in 2D which is given by the formula:
    //curl_z = (dF_y/dx - dF_x/dy) where F_x and F_y are the components of the vector field at the grid point

void CurlEngine2D::computeCurl() {
    for (int iy = 1; iy < resY - 1; ++iy) {
        for (int ix = 1; ix < resX - 1; ++ix) {
            int idx = iy * resX + ix;
            grid[idx].curl_z = VectorMath::curl2D(
                grid[iy * resX + (ix - 1)], 
                grid[iy * resX + (ix + 1)],
                grid[(iy - 1) * resX + ix], 
                grid[(iy + 1) * resX + ix], 
                dx, dy
            );
        }
    }
}

void CurlEngine2D::compute() {
    generateGrid();
    computeCurl();
}

// CurlEngine3D Implementation
CurlEngine3D::CurlEngine3D(int rx, int ry, int rz,
                           double xmin, double xmax,
                           double ymin, double ymax,
                           double zmin, double zmax) 
    : SpatialFieldEngine3D(rx, ry, rz, xmin, xmax, ymin, ymax, zmin, zmax) {}

void CurlEngine3D::computeCurl() {
    for (int iz = 1; iz < resZ - 1; ++iz) {
        for (int iy = 1; iy < resY - 1; ++iy) {
            for (int ix = 1; ix < resX - 1; ++ix) {
                int idx = iz * resX * resY + iy * resX + ix;
                
                // Lambda for safe grid access
                auto G = [&](int iix, int iiy, int iiz) -> const GridPoint3D& {
                    return grid[iiz * resX * resY + iiy * resX + iix];
                };

                double dFz_dy = (G(ix, iy + 1, iz).fz - G(ix, iy - 1, iz).fz) / (2.0 * dy);
                double dFy_dz = (G(ix, iy, iz + 1).fy - G(ix, iy, iz - 1).fy) / (2.0 * dz);
                
                double dFx_dz = (G(ix, iy, iz + 1).fx - G(ix, iy, iz - 1).fx) / (2.0 * dz);
                double dFz_dx = (G(ix + 1, iy, iz).fz - G(ix - 1, iy, iz).fz) / (2.0 * dx);
                
                double dFy_dx = (G(ix + 1, iy, iz).fy - G(ix - 1, iy, iz).fy) / (2.0 * dx);
                double dFx_dy = (G(ix, iy + 1, iz).fx - G(ix, iy - 1, iz).fx) / (2.0 * dy);

                grid[idx].curl_x = dFz_dy - dFy_dz;
                grid[idx].curl_y = dFx_dz - dFz_dx;
                grid[idx].curl_z = dFy_dx - dFx_dy;
            }
        }
    }
}

void CurlEngine3D::compute() {
    generateGrid();
    computeCurl();
}