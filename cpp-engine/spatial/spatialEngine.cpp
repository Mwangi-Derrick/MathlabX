#include "spatialEngine.h"
#include "../math/vector_math.h"
#include <cmath>
#include <algorithm>

// SpatialFieldEngine Implementation
SpatialFieldEngine::SpatialFieldEngine(
    int rx, int ry, int rz,
    double xmin, double xmax,
    double ymin, double ymax,
    double zmin, double zmax
) : resX(rx), resY(ry), resZ(rz),
    xMin(xmin), xMax(xmax), yMin(ymin), yMax(ymax), zMin(zmin), zMax(zmax) {
    recomputeSteps();
}

void SpatialFieldEngine::setResolution(int rx, int ry, int rz) {
    resX = std::max(2, std::min(rx, 100));
    resY = std::max(2, std::min(ry, 100));
    resZ = std::max(2, std::min(rz, 100));
    recomputeSteps();
}

void SpatialFieldEngine::setBounds(double xmin, double xmax, double ymin, double ymax,
                                   double zmin, double zmax) {
    xMin = xmin; xMax = xmax;
    yMin = ymin; yMax = ymax;
    zMin = zmin; zMax = zmax;
    recomputeSteps();
}

void SpatialFieldEngine::recomputeSteps() {
    dx = (xMax - xMin) / (resX - 1);
    dy = (yMax - yMin) / (resY - 1);
    dz = (resZ > 1) ? (zMax - zMin) / (resZ - 1) : 1.0;
}

// SpatialFieldEngine2D Implementation
SpatialFieldEngine2D::SpatialFieldEngine2D(
    int rx, int ry,
    double xmin, double xmax,
    double ymin, double ymax
) : SpatialFieldEngine(rx, ry, 1, xmin, xmax, ymin, ymax),
    ampX(1.0), ampY(1.0), freqX(1.0), freqY(1.0), preset("rotation") {}

void SpatialFieldEngine2D::setPreset(const std::string& name) { 
    preset = name; 
}

void SpatialFieldEngine2D::setCustomParams(double ax, double ay, double fx, double fy) {
    ampX = ax; ampY = ay; freqX = fx; freqY = fy; preset = "custom";
}

void SpatialFieldEngine2D::evaluateField(double x, double y, double& fx, double& fy) const {
    if (preset == "rotation") { fx = -y; fy = x; }
    else if (preset == "source") { fx = x; fy = y; }
    else if (preset == "sink") { fx = -x; fy = -y; }
    else if (preset == "saddle") { fx = x; fy = -y; }
    else {
        fx = ampX * std::cos(freqX * y);
        fy = ampY * std::sin(freqY * x);
    }
}

void SpatialFieldEngine2D::generateGrid() {
    grid.clear();
    grid.resize(resX * resY);
    //parallelize the loop across threads
    #pragma omp parallel for
    for (int iy = 0; iy < resY; ++iy) {
        for (int ix = 0; ix < resX; ++ix) {
            double x = xMin + ix * dx;
            double y = yMin + iy * dy;
            double fx, fy;
            evaluateField(x, y, fx, fy);
            grid[iy * resX + ix] = { x, y, fx, fy, 0.0, 0.0 };
        }
    }
}

std::vector<GridPoint2D> SpatialFieldEngine2D::getGrid() const { 
    return grid; 
}

int SpatialFieldEngine2D::getResX() const { 
    return resX; 
}

int SpatialFieldEngine2D::getResY() const { 
    return resY; 
}

// SpatialFieldEngine3D Implementation
SpatialFieldEngine3D::SpatialFieldEngine3D(
    int rx, int ry, int rz,
    double xmin, double xmax,
    double ymin, double ymax,
    double zmin, double zmax
) : SpatialFieldEngine(rx, ry, rz, xmin, xmax, ymin, ymax, zmin, zmax),
    ampX(1.0), ampY(1.0), ampZ(1.0), freqX(1.0), freqY(1.0), freqZ(1.0), preset("rotation") {}

void SpatialFieldEngine3D::setPreset(const std::string& name) { 
    preset = name; 
}

void SpatialFieldEngine3D::setCustomParams(double ax, double ay, double az, double fx, double fy, double fz) {
    ampX = ax; ampY = ay; ampZ = az; freqX = fx; freqY = fy; freqZ = fz; preset = "custom";
}

void SpatialFieldEngine3D::evaluateField3D(double x, double y, double z, double& fx, double& fy, double& fz) const {
    if (preset == "rotation") { fx = -y; fy = x; fz = 0.0; }
    else if (preset == "source") { fx = x; fy = y; fz = z; }
    else if (preset == "sink") { fx = -x; fy = -y; fz = -z; }
    else if (preset == "helical") { fx = -y; fy = x; fz = 1.0; }
    else {
        fx = ampX * std::cos(freqX * y);
        fy = ampY * std::sin(freqY * x);
        fz = ampZ * std::cos(freqZ * z);
    }
}

void SpatialFieldEngine3D::generateGrid() {
    grid.clear();
    grid.resize(resX * resY * resZ);
    for (int iz = 0; iz < resZ; ++iz) {
        for (int iy = 0; iy < resY; ++iy) {
            for (int ix = 0; ix < resX; ++ix) {
                double x = xMin + ix * dx;
                double y = yMin + iy * dy;
                double z = zMin + iz * dz;
                double fx, fy, fz;
                evaluateField3D(x, y, z, fx, fy, fz);
                int idx = iz * resX * resY + iy * resX + ix;
                grid[idx] = { x, y, z, fx, fy, fz, 0.0, 0.0, 0.0, 0.0 };
            }
        }
    }
}

std::vector<GridPoint3D> SpatialFieldEngine3D::getGrid() const { 
    return grid; //retrun a variable named grid of type vector<GridPoint3D>
}

int SpatialFieldEngine3D::getResX() const { 
    return resX; //retrun a variable named resX of type int
}

int SpatialFieldEngine3D::getResY() const { 
    return resY; //retrun a variable named resY of type int
}

int SpatialFieldEngine3D::getResZ() const { 
    return resZ; 
}