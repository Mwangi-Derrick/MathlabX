/* this is a vector mathematics namespace
it is used for atomic math operations on individual points
*/

#include "vector_math.h"

namespace VectorMath {
     double divergence2D(const GridPoint2D& prevX, const GridPoint2D& nextX,
                               const GridPoint2D& prevY, const GridPoint2D& nextY,
                               double dx, double dy) {
        double dFx_dx = (nextX.fx - prevX.fx) / (2.0 * dx);
        double dFy_dy = (nextY.fy - prevY.fy) / (2.0 * dy);
        return dFx_dx + dFy_dy;
    }
    //it is a vector in z direction
    double curl2D(const GridPoint2D& prevX, const GridPoint2D& nextX,
                    const GridPoint2D& prevY, const GridPoint2D& nextY,
                    double dx, double dy) {
            // Formula: ∂Fy/∂x - ∂Fx/∂y
            double dFy_dx = (nextX.fy - prevX.fy) / (2.0 * dx);
            double dFx_dy = (nextY.fx - prevY.fx) / (2.0 * dy);
            
            return dFy_dx - dFx_dy;
        }


     double divergence3D(const GridPoint3D& pX, const GridPoint3D& nX,
                               const GridPoint3D& pY, const GridPoint3D& nY,
                               const GridPoint3D& pZ, const GridPoint3D& nZ,
                               double dx, double dy, double dz) {
        //(i,j,k)
        //F=(x,y,z) = P(x,y,z) + Q(x,y,z) + R(x,y,z) + L(x,y,z) + B(x,y,z) + T(x,y,z)
        return (nX.fx - pX.fx) / (2.0 * dx) +
               (nY.fy - pY.fy) / (2.0 * dy) +
               (nZ.fz - pZ.fz) / (2.0 * dz);
    }

    /* 
   Returns the curl vector (∇ × F) at a central point.
   Formula:
   i: (∂Fz/∂y - ∂Fy/∂z)
   j: (∂Fx/∂z - ∂Fz/∂x)
   k: (∂Fy/∂x - ∂Fx/∂y)
*/
  GridPoint3D curl3D(const GridPoint3D& pX, const GridPoint3D& nX,
                   const GridPoint3D& pY, const GridPoint3D& nY,
                   const GridPoint3D& pZ, const GridPoint3D& nZ,
                   double dx, double dy, double dz) {
    
    GridPoint3D result;

    // x-component: dFz/dy - dFy/dz
    result.fx = (nY.fz - pY.fz) / (2.0 * dy) - 
                (nZ.fy - pZ.fy) / (2.0 * dz);

    // y-component: dFx/dz - dFz/dx
    result.fy = (nZ.fx - pZ.fx) / (2.0 * dz) - 
                (nX.fz - pX.fz) / (2.0 * dx);

    // z-component: dFy/dx - dFx/dy
    result.fz = (nX.fy - pX.fy) / (2.0 * dx) - 
                (nY.fx - pY.fx) / (2.0 * dy);

    return result;
}

}