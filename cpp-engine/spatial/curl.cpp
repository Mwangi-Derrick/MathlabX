#include "spatialEngine.h"
#include "../math/vector_math.h"
#include <cmath>
#include <vector>

class CurlEngine2D : public SpatialFieldEngine2D {
public:
    CurlEngine2D(int rx = 20, int ry = 20, double xmin = -5.0, double xmax = 5.0, double ymin = -5.0, double ymax = 5.0) 
        : SpatialFieldEngine2D(rx, ry, xmin, xmax, ymin, ymax) {}

    void computeCurl() {
        for (int iy = 1; iy < resY - 1; ++iy) {
            for (int ix = 1; ix < resX - 1; ++ix) {
                int idx = iy * resX + ix;
                grid[idx].curl_z = VectorMath::curl2D(
                    grid[iy*resX + (ix-1)], grid[iy*resX + (ix+1)],
                    grid[(iy-1)*resX + ix], grid[(iy+1)*resX + ix], dx, dy
                );
            }
        }
    }

    void compute() {
        generateGrid();
        computeCurl();
    }
};


class CurlEngine3D : public SpatialFieldEngine3D {
public:
    CurlEngine3D(int rx = 10, int ry = 10, int rz = 10, double xmin = -5.0, double xmax = 5.0, double ymin = -5.0, double ymax = 5.0, double zmin = -5.0, double zmax = 5.0) 
        : SpatialFieldEngine3D(rx, ry, rz, xmin, xmax, ymin, ymax, zmin, zmax) {}

    void computeCurl() {
        for (int iz = 1; iz < resZ - 1; ++iz) {
            for (int iy = 1; iy < resY - 1; ++iy) {
                for (int ix = 1; ix < resX - 1; ++ix) {
                    int idx = iz * resX * resY + iy * resX + ix;
                    auto G = [&](int iix, int iiy, int iiz) -> const GridPoint3D& {
                        return grid[iiz * resX * resY + iiy * resX + iix];
                    };

                    double dFz_dy = (G(ix,iy+1,iz).fz - G(ix,iy-1,iz).fz) / (2.0 * dy);
                    double dFy_dz = (G(ix,iy,iz+1).fy - G(ix,iy,iz-1).fy) / (2.0 * dz);
                    
                    double dFx_dz = (G(ix,iy,iz+1).fx - G(ix,iy,iz-1).fx) / (2.0 * dz);
                    double dFz_dx = (G(ix+1,iy,iz).fz - G(ix-1,iy,iz).fz) / (2.0 * dx);
                    
                    double dFy_dx = (G(ix+1,iy,iz).fy - G(ix-1,iy,iz).fy) / (2.0 * dx);
                    double dFx_dy = (G(ix,iy+1,iz).fx - G(ix,iy-1,iz).fx) / (2.0 * dy);

                    grid[idx].curl_x = dFz_dy - dFy_dz;
                    grid[idx].curl_y = dFx_dz - dFz_dx;
                    grid[idx].curl_z = dFy_dx - dFx_dy;
                }
            }
        }
    }

    void compute() {
        generateGrid();
        computeCurl();
    }
};


