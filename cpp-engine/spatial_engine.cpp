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

// ─── HYBRID ARCHITECTURE: Atomic Core ─────────────────────────────────────────

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

class DivergenceEngine2D : public SpatialFieldEngine2D {
public:
    DivergenceEngine2D(int rx = 20, int ry = 20, double xmin = -5.0, double xmax = 5.0, double ymin = -5.0, double ymax = 5.0) 
        : SpatialFieldEngine2D(rx, ry, xmin, xmax, ymin, ymax) {}

    void computeDivergence() {
        for (int iy = 1; iy < resY - 1; ++iy) {
            for (int ix = 1; ix < resX - 1; ++ix) {
                int idx = iy * resX + ix;
                grid[idx].divergence = VectorMath::divergence2D(
                    grid[iy*resX + (ix-1)], grid[iy*resX + (ix+1)],
                    grid[(iy-1)*resX + ix], grid[(iy+1)*resX + ix], dx, dy
                );
            }
        }
    }

    void compute() {
        generateGrid();
        computeDivergence();
    }
};

class CurlEngine2D : public SpatialFieldEngine2D {
public:
    CurlEngine2D(int rx = 20, int ry = 20, double xmin = -5.0, double xmax = 5.0, double ymin = -5.0, double ymax = 5.0) 
        : SpatialFieldEngine2D(rx, ry, xmin, xmax, ymin, ymax) {}

    void computeCurl() {
        for (int iy = 1; iy < resY - 1; ++iy) {
            for (int ix = 1; ix < resX - 1; ++ix) {
                int idx = iy * resX + ix;
                grid[idx].curl_z = VectorMath::curl2D(
                    grid[iy*resX + (ix-1)], grid[iy*resX + (ix+1)],
                    grid[(iy-1)*resX + ix], grid[(iy+1)*resX + ix], dx, dy
                );
            }
        }
    }

    void compute() {
        generateGrid();
        computeCurl();
    }
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

class DivergenceEngine3D : public SpatialFieldEngine3D {
public:
    DivergenceEngine3D(int rx = 10, int ry = 10, int rz = 10, double xmin = -5.0, double xmax = 5.0, double ymin = -5.0, double ymax = 5.0, double zmin = -5.0, double zmax = 5.0) 
        : SpatialFieldEngine3D(rx, ry, rz, xmin, xmax, ymin, ymax, zmin, zmax) {}

    void computeDivergence() {
        for (int iz = 1; iz < resZ - 1; ++iz) {
            for (int iy = 1; iy < resY - 1; ++iy) {
                for (int ix = 1; ix < resX - 1; ++ix) {
                    int idx = iz * resX * resY + iy * resX + ix;
                    auto& pX = grid[iz*resX*resY + iy*resX + (ix-1)];
                    auto& nX = grid[iz*resX*resY + iy*resX + (ix+1)];
                    auto& pY = grid[iz*resX*resY + (iy-1)*resX + ix];
                    auto& nY = grid[iz*resX*resY + (iy+1)*resX + ix];
                    auto& pZ = grid[(iz-1)*resX*resY + iy*resX + ix];
                    auto& nZ = grid[(iz+1)*resX*resY + iy*resX + ix];
                    
                    grid[idx].divergence = VectorMath::divergence3D(pX, nX, pY, nY, pZ, nZ, dx, dy, dz);
                }
            }
        }
    }

    void compute() {
        generateGrid();
        computeDivergence();
    }
};

class CurlEngine3D : public SpatialFieldEngine3D {
public:
    CurlEngine3D(int rx = 10, int ry = 10, int rz = 10, double xmin = -5.0, double xmax = 5.0, double ymin = -5.0, double ymax = 5.0, double zmin = -5.0, double zmax = 5.0) 
        : SpatialFieldEngine3D(rx, ry, rz, xmin, xmax, ymin, ymax, zmin, zmax) {}

    void computeCurl() {
        for (int iz = 1; iz < resZ - 1; ++iz) {
            for (int iy = 1; iy < resY - 1; ++iy) {
                for (int ix = 1; ix < resX - 1; ++ix) {
                    int idx = iz * resX * resY + iy * resX + ix;
                    auto G = [&](int iix, int iiy, int iiz) -> const GridPoint3D& {
                        return grid[iiz * resX * resY + iiy * resX + iix];
                    };

                    double dFz_dy = (G(ix,iy+1,iz).fz - G(ix,iy-1,iz).fz) / (2.0 * dy);
                    double dFy_dz = (G(ix,iy,iz+1).fy - G(ix,iy,iz-1).fy) / (2.0 * dz);
                    
                    double dFx_dz = (G(ix,iy,iz+1).fx - G(ix,iy,iz-1).fx) / (2.0 * dz);
                    double dFz_dx = (G(ix+1,iy,iz).fz - G(ix-1,iy,iz).fz) / (2.0 * dx);
                    
                    double dFy_dx = (G(ix+1,iy,iz).fy - G(ix-1,iy,iz).fy) / (2.0 * dx);
                    double dFx_dy = (G(ix,iy+1,iz).fx - G(ix,iy-1,iz).fx) / (2.0 * dy);

                    grid[idx].curl_x = dFz_dy - dFy_dz;
                    grid[idx].curl_y = dFx_dz - dFz_dx;
                    grid[idx].curl_z = dFy_dx - dFx_dy;
                }
            }
        }
    }

    void compute() {
        generateGrid();
        computeCurl();
    }
};

// ─── Emscripten Bindings ──────────────────────────────────────────────────────

EMSCRIPTEN_BINDINGS(wave_module) {
    emscripten::value_object<Point2D>("Point2D")
        .field("x", &Point2D::x)
        .field("y", &Point2D::y);

    emscripten::register_vector<Point2D>("Point2DVector");

    emscripten::class_<WaveEngine>("WaveEngine")
        .function("setSamples", &WaveEngine::setSamples)
        .function("getSamples", &WaveEngine::getSamples);

    emscripten::class_<ACCircuitEngine, emscripten::base<WaveEngine>>("ACCircuitEngine")
        .constructor<double, double, int>()
        .function("setCircuitParameters", &ACCircuitEngine::setCircuitParameters)
        .function("setSource", &ACCircuitEngine::setSource)
        .function("getOmega", &ACCircuitEngine::getOmega)
        .function("getInductiveReactance", &ACCircuitEngine::getInductiveReactance)
        .function("getCapacitiveReactance", &ACCircuitEngine::getCapacitiveReactance)
        .function("getImpedance", &ACCircuitEngine::getImpedance)
        .function("getPhaseAngle", &ACCircuitEngine::getPhaseAngle)
        .function("getCurrentAmplitude", &ACCircuitEngine::getCurrentAmplitude)
        .function("getPowerFactor", &ACCircuitEngine::getPowerFactor)
        .function("getRealPower", &ACCircuitEngine::getRealPower)
        .function("getReactivePower", &ACCircuitEngine::getReactivePower)
        .function("getApparentPower", &ACCircuitEngine::getApparentPower)
        .function("generateWaves", &ACCircuitEngine::generateWaves)
        .function("getVoltagePoints", &ACCircuitEngine::getVoltagePoints)
        .function("getCurrentPoints", &ACCircuitEngine::getCurrentPoints);

    // ── Spatial Structs ──
    emscripten::value_object<GridPoint2D>("GridPoint2D")
        .field("x",          &GridPoint2D::x)
        .field("y",          &GridPoint2D::y)
        .field("fx",         &GridPoint2D::fx)
        .field("fy",         &GridPoint2D::fy)
        .field("divergence", &GridPoint2D::divergence)
        .field("curl_z",     &GridPoint2D::curl_z);

    emscripten::value_object<GridPoint3D>("GridPoint3D")
        .field("x",          &GridPoint3D::x)
        .field("y",          &GridPoint3D::y)
        .field("z",          &GridPoint3D::z)
        .field("fx",         &GridPoint3D::fx)
        .field("fy",         &GridPoint3D::fy)
        .field("fz",         &GridPoint3D::fz)
        .field("divergence", &GridPoint3D::divergence)
        .field("curl_x",     &GridPoint3D::curl_x)
        .field("curl_y",     &GridPoint3D::curl_y)
        .field("curl_z",     &GridPoint3D::curl_z);

    emscripten::register_vector<GridPoint2D>("GridPoint2DVector");
    emscripten::register_vector<GridPoint3D>("GridPoint3DVector");

    // ── 2D Engines ──
    emscripten::class_<SpatialFieldEngine2D>("SpatialFieldEngine2D")
        .constructor<int, int, double, double, double, double>()
        .function("setPreset",       &SpatialFieldEngine2D::setPreset)
        .function("setCustomParams", &SpatialFieldEngine2D::setCustomParams)
        .function("generateGrid",    &SpatialFieldEngine2D::generateGrid)
        .function("getGrid",         &SpatialFieldEngine2D::getGrid)
        .function("getResX",         &SpatialFieldEngine2D::getResX)
        .function("getResY",         &SpatialFieldEngine2D::getResY)
        .function("setResolution",   &SpatialFieldEngine2D::setResolution)
        .function("setBounds",       &SpatialFieldEngine2D::setBounds);

    emscripten::class_<DivergenceEngine2D, emscripten::base<SpatialFieldEngine2D>>("DivergenceEngine2D")
        .constructor<int, int, double, double, double, double>()
        .function("compute",            &DivergenceEngine2D::compute)
        .function("computeDivergence",  &DivergenceEngine2D::computeDivergence);

    emscripten::class_<CurlEngine2D, emscripten::base<SpatialFieldEngine2D>>("CurlEngine2D")
        .constructor<int, int, double, double, double, double>()
        .function("compute",      &CurlEngine2D::compute)
        .function("computeCurl",  &CurlEngine2D::computeCurl);

    // ── 3D Engines ──
    emscripten::class_<SpatialFieldEngine3D>("SpatialFieldEngine3D")
        .constructor<int, int, int, double, double, double, double, double, double>()
        .function("setPreset",        &SpatialFieldEngine3D::setPreset)
        .function("setCustomParams",  &SpatialFieldEngine3D::setCustomParams)
        .function("generateGrid",     &SpatialFieldEngine3D::generateGrid)
        .function("getGrid",          &SpatialFieldEngine3D::getGrid)
        .function("getResX",          &SpatialFieldEngine3D::getResX)
        .function("getResY",          &SpatialFieldEngine3D::getResY)
        .function("getResZ",          &SpatialFieldEngine3D::getResZ)
        .function("setResolution",    &SpatialFieldEngine3D::setResolution)
        .function("setBounds",        &SpatialFieldEngine3D::setBounds);

    emscripten::class_<DivergenceEngine3D, emscripten::base<SpatialFieldEngine3D>>("DivergenceEngine3D")
        .constructor<int, int, int, double, double, double, double, double, double>()
        .function("compute",           &DivergenceEngine3D::compute)
        .function("computeDivergence", &DivergenceEngine3D::computeDivergence);

    emscripten::class_<CurlEngine3D, emscripten::base<SpatialFieldEngine3D>>("CurlEngine3D")
        .constructor<int, int, int, double, double, double, double, double, double>()
        .function("compute",      &CurlEngine3D::compute)
        .function("computeCurl",  &CurlEngine3D::computeCurl);
}
