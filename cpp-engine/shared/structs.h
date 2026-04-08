#ifndef STRUCTS_H
#define STRUCTS_H

struct Point2D {
    double x, y;
    Point2D(double x_ = 0, double y_ = 0) : x(x_), y(y_) {}
};

struct Point3D {
    double x, y, z;
    double vx, vy, vz;
    Point3D(double x_ = 0, double y_ = 0, double z_ = 0,
            double vx_ = 0, double vy_ = 0, double vz_ = 0)
        : x(x_), y(y_), z(z_), vx(vx_), vy(vy_), vz(vz_) {}
};

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