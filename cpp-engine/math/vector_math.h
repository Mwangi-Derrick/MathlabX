#ifndef VECTOR_MATH_H
#define VECTOR_MATH_H

#include <cmath>

// Forward declarations
struct GridPoint2D{
    double x, y;
    double fx, fy; // The field vector at this point
    double divergence; // The divergence at this point
    double curl_z;    // The z-component of the curl at this point (for 2D fields)
};
struct GridPoint3D{
    double x, y, z;
    double fx, fy, fz; // The field vector at this point
    double divergence; // The divergence at this point
    double curl_x, curl_y, curl_z; // The components of the curl at this point (for 3D fields)
};

/* this is a vector mathematics namespace
it is used for atomic math operations on individual points
*/
namespace VectorMath {
    inline double divergence2D(const GridPoint2D& prevX, const GridPoint2D& nextX,
                               const GridPoint2D& prevY, const GridPoint2D& nextY,
                               double dx, double dy);

    inline double curl2D(const GridPoint2D& prevX, const GridPoint2D& nextX,
                         const GridPoint2D& prevY, const GridPoint2D& nextY,
                         double dx, double dy);

    inline double divergence3D(const GridPoint3D& pX, const GridPoint3D& nX,
                               const GridPoint3D& pY, const GridPoint3D& nY,
                               const GridPoint3D& pZ, const GridPoint3D& nZ,
                               double dx, double dy, double dz);
}

#endif // VECTOR_MATH_H