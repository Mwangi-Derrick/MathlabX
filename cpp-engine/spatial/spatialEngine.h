#ifndef SPATIAL_ENGINE_H
#define SPATIAL_ENGINE_H
#include <vector>
#include <string>
#include <cmath>
#include "../shared/structs.h"

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
    );
    virtual ~SpatialFieldEngine() = default;

    void setResolution(int rx, int ry, int rz = 1);
    void setBounds(double xmin, double xmax, double ymin, double ymax,
                   double zmin = -5.0, double zmax = 5.0);
protected:
    void recomputeSteps();
};

class SpatialFieldEngine2D : public SpatialFieldEngine {
protected:
    std::vector<GridPoint2D> grid;
    double ampX, ampY, freqX, freqY;
    std::string preset;

public:
    SpatialFieldEngine2D(
        int rx = 20, int ry = 20,
        double xmin = -5.0, double xmax = 5.0,
        double ymin = -5.0, double ymax = 5.0
    );

    void setPreset(const std::string& name);
    void setCustomParams(double ax, double ay, double fx, double fy);
    void evaluateField(double x, double y, double& fx, double& fy) const;
    void generateGrid();
    std::vector<GridPoint2D> getGrid() const;
    int getResX() const;
    int getResY() const;
};

class SpatialFieldEngine3D : public SpatialFieldEngine {
protected:
    std::vector<GridPoint3D> grid;
    double ampX, ampY, ampZ, freqX, freqY, freqZ;
    std::string preset;

public:
    SpatialFieldEngine3D(
        int rx = 10, int ry = 10, int rz = 10,
        double xmin = -5.0, double xmax = 5.0, 
        double ymin = -5.0, double ymax = 5.0, 
        double zmin = -5.0, double zmax = 5.0
    );

    void setPreset(const std::string& name);
    void setCustomParams(double ax, double ay, double az, double fx, double fy, double fz);
    void evaluateField3D(double x, double y, double z, double& fx, double& fy, double& fz) const;
    void generateGrid();
    std::vector<GridPoint3D> getGrid() const;
    int getResX() const;
    int getResY() const;
    int getResZ() const;
};

#endif // SPATIAL_ENGINE_H