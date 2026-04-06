#ifndef STRUCTS_H
#define STRUCTS_H

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

#endif // STRUCTS_H