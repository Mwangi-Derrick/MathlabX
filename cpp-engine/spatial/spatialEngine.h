#ifndef SPATIAL_ENGINE_H
#define SPATIAL_ENGINE_H

// ─── Base Class ───────────────────────────────────────────────────────────────

class SpatialFieldEngine {
protected:
    int resX, resY, resZ;
    double xMin, xMax;
    double yMin, yMax;
    double zMin, zMax;
    double dx, dy, dz;

public:
    SpatialFieldEngine(
        int rx = 20, int ry = 20, int rz = 20,
        double xmin = -5.0, double xmax = 5.0,
        double ymin = -5.0, double ymax = 5.0,
        double zmin = -5.0, double zmax = 5.0
    ) : resX(rx), resY(ry), resZ(rz),
        xMin(xmin), xMax(xmax), yMin(ymin), yMax(ymax), zMin(zmin), zMax(zmax)
    {}
    virtual ~SpatialFieldEngine() = default;

    void setResolution(int rx, int ry, int rz = 1) { }

    void setBounds(double xmin, double xmax, double ymin, double ymax,
                   double zmin = -5.0, double zmax = 5.0) { }
private:
    void recomputeSteps() {};
};

#endif // SPATIAL_ENGINE_H