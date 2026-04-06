#include "spatialEngine.h"



// ─── Shared Data Structures ───────────────────────────────────────────────────

struct GridPoint2D {
    double x, y;
    double fx, fy;
    double divergence;
    double curl_z;
};

struct GridPoint3D {
    double x, y, z;
    double fx, fy, fz;
    double divergence;
    double curl_x, curl_y, curl_z;
};


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
    {
        recomputeSteps();
    }
    virtual ~SpatialFieldEngine() = default;

    void setResolution(int rx, int ry, int rz = 1) {
        resX = std::max(2, std::min(rx, 100));
        resY = std::max(2, std::min(ry, 100));
        resZ = std::max(2, std::min(rz, 100));
        recomputeSteps();
    }

    void setBounds(double xmin, double xmax, double ymin, double ymax,
                   double zmin = -5.0, double zmax = 5.0) {
        xMin = xmin; xMax = xmax;
        yMin = ymin; yMax = ymax;
        zMin = zmin; zMax = zmax;
        recomputeSteps();
    }
private:
    void recomputeSteps() {
        dx = (xMax - xMin) / (resX - 1);
        dy = (yMax - yMin) / (resY - 1);
        dz = (resZ > 1) ? (zMax - zMin) / (resZ - 1) : 1.0;
    }
};

// ─── 2D Engines ───────────────────────────────────────────────────────────────

// ─── 2D Engines ───────────────────────────────────────────────────────────────

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
    ) : SpatialFieldEngine(rx, ry, 1, xmin, xmax, ymin, ymax),
        ampX(1.0), ampY(1.0), freqX(1.0), freqY(1.0), preset("rotation") {}

    void setPreset(const std::string& name) { preset = name; }
    void setCustomParams(double ax, double ay, double fx, double fy) {
        ampX = ax; ampY = ay; freqX = fx; freqY = fy; preset = "custom";
    }

    void evaluateField(double x, double y, double& fx, double& fy) const {
        if (preset == "rotation") { fx = -y; fy = x; }
        else if (preset == "source") { fx = x; fy = y; }
        else if (preset == "sink") { fx = -x; fy = -y; }
        else if (preset == "saddle") { fx = x; fy = -y; }
        else {
            fx = ampX * std::cos(freqX * y);
            fy = ampY * std::sin(freqY * x);
        }
    }

    void generateGrid() {
        grid.clear();
        grid.resize(resX * resY);
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

    std::vector<GridPoint2D> getGrid() const { return grid; }
    int getResX() const { return resX; }
    int getResY() const { return resY; }
};


// ─── 3D Engines ───────────────────────────────────────────────────────────────

class SpatialFieldEngine3D : public SpatialFieldEngine {
protected:
    std::vector<GridPoint3D> grid;
    double ampX, ampY, ampZ, freqX, freqY, freqZ;
    std::string preset;

public:
    SpatialFieldEngine3D(
        int rx = 10, int ry = 10, int rz = 10,
        double xmin = -5.0, double xmax = 5.0, double ymin = -5.0, double ymax = 5.0, double zmin = -5.0, double zmax = 5.0
    ) : SpatialFieldEngine(rx, ry, rz, xmin, xmax, ymin, ymax, zmin, zmax),
        ampX(1.0), ampY(1.0), ampZ(1.0), freqX(1.0), freqY(1.0), freqZ(1.0), preset("rotation") {}

    void setPreset(const std::string& name) { preset = name; }
    void setCustomParams(double ax, double ay, double az, double fx, double fy, double fz) {
        ampX = ax; ampY = ay; ampZ = az; freqX = fx; freqY = fy; freqZ = fz; preset = "custom";
    }

    void evaluateField3D(double x, double y, double z, double& fx, double& fy, double& fz) const {
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

    void generateGrid() {
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

    std::vector<GridPoint3D> getGrid() const { return grid; }
    int getResX() const { return resX; }
    int getResY() const { return resY; }
    int getResZ() const { return resZ; }
};

