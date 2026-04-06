#ifndef VECTOR_MATH_H
#define VECTOR_MATH_H
#include "../shared/structs.h"

#include <cmath>

// Forward declarations


/* this is a vector mathematics namespace
it is used for atomic math operations on individual points
*/
namespace VectorMath {
     double divergence2D(const GridPoint2D& prevX, const GridPoint2D& nextX,
                               const GridPoint2D& prevY, const GridPoint2D& nextY,
                               double dx, double dy);

     double curl2D(const GridPoint2D& prevX, const GridPoint2D& nextX,
                         const GridPoint2D& prevY, const GridPoint2D& nextY,
                         double dx, double dy);

     double divergence3D(const GridPoint3D& pX, const GridPoint3D& nX,
                               const GridPoint3D& pY, const GridPoint3D& nY,
                               const GridPoint3D& pZ, const GridPoint3D& nZ,
                               double dx, double dy, double dz);
}

#endif // VECTOR_MATH_H