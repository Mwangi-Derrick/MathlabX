/* this is a vector mathematics namespace
it is used for atomic math operations on individual points
*/

#include "VectorMath.h"

namespace VectorMath {
    inline double divergence2D(const GridPoint2D& prevX, const GridPoint2D& nextX,
                               const GridPoint2D& prevY, const GridPoint2D& nextY,
                               double dx, double dy) {
        double dFx_dx = (nextX.fx - prevX.fx) / (2.0 * dx);
        double dFy_dy = (nextY.fy - prevY.fy) / (2.0 * dy);
        return dFx_dx + dFy_dy;
    }

    inline double curl2D(const GridPoint2D& prevX, const GridPoint2D& nextX,
                         const GridPoint2D& prevY, const GridPoint2D& nextY,
                         double dx, double dy) {
        double dFy_dx = (nextX.fy - prevX.fy) / (2.0 * dx);
        double dFx_dy = (nextY.fx - prevY.fx) / (2.0 * dy);
        return dFy_dx - dFx_dy;
    }

    inline double divergence3D(const GridPoint3D& pX, const GridPoint3D& nX,
                               const GridPoint3D& pY, const GridPoint3D& nY,
                               const GridPoint3D& pZ, const GridPoint3D& nZ,
                               double dx, double dy, double dz) {
        return (nX.fx - pX.fx) / (2.0 * dx) +
               (nY.fy - pY.fy) / (2.0 * dy) +
               (nZ.fz - pZ.fz) / (2.0 * dz);
    }
}