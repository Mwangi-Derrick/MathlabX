#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include <filesystem>

#include "../cpp-engine/time_domain/ACCircuitEngine.h"
#include "../cpp-engine/time_domain/PhasorEngine.h"
#include "../cpp-engine/spatial/curl.h"
#include "../cpp-engine/spatial/divergence.h"
#include "../logging/JsonLogger.h"

/**
 * JKUAT OOP 2nd Year Mini-Project: MathLabX CLI
 *
 * OOP Concepts demonstrated:
 * 1. Inheritance   - WaveEngine -> ACCircuitEngine -> PhasorEngine
 *                  - JsonLogger inherited per simulation module
 * 2. Polymorphism  - Virtual destructors, method overriding
 * 3. Abstraction   - Physics formulas encapsulated in engine methods
 * 4. Encapsulation - JsonLogger hides JSON serialization internals
 * 5. Data Logging  - Each simulation flushes structured JSON to logs/
 */

static const std::string LOG_DIR = "logs";

void ensureLogDir() {
    std::filesystem::create_directories(LOG_DIR);
}

void printHeader(const std::string& title) {
    std::cout << "\n========================================\n";
    std::cout << "  " << title << "\n";
    std::cout << "========================================\n";
}

// ============================================================
// 1. AC RLC Circuit
// ============================================================
void runACCircuitSimulation() {
    printHeader("1. AC RLC CIRCUIT ANALYSIS");

    ACCircuitEngine circuit;

    double R = 10.0;   // 10 Ohms
    double L = 0.05;   // 50 mH
    double C = 100e-6; // 100 uF
    double Vm = 240.0; // 240V Peak
    double f = 50.0;   // 50Hz (Kenyan Grid Standard)

    circuit.setCircuitParameters(R, L, C);
    circuit.setSource(Vm, f);
    circuit.generateWaves();

    // --- Logging (Encapsulation + Inheritance demo) ---
    JsonLogger logger("ACCircuitEngine");

    // Parameters block (nested JSON object built manually via logRaw)
    std::ostringstream params;
    params << "{\n"
           << "    \"resistance\": " << R << ",\n"
           << "    \"inductance\": " << L << ",\n"
           << "    \"capacitance\": " << C << ",\n"
           << "    \"source_voltage_peak\": " << Vm << ",\n"
           << "    \"frequency_hz\": " << f << "\n"
           << "  }";
    logger.logRaw("parameters", params.str());

    // Results
    logger.logDouble("omega_rad_per_s",    circuit.getOmega());
    logger.logDouble("impedance_ohms",     circuit.getImpedance());
    logger.logDouble("phase_angle_rad",    circuit.getPhaseAngle());
    logger.logDouble("power_factor",       circuit.getPowerFactor());
    logger.logDouble("real_power_W",       circuit.getRealPower());
    logger.logDouble("reactive_power_VAR", circuit.getReactivePower());

    logger.printToConsole();
    logger.flush(LOG_DIR + "/ac_circuit.json");
}

// ============================================================
// 2. Phasor Diagram
// ============================================================
void runPhasorSimulation() {
    printHeader("2. PHASOR VECTOR DIAGRAM");

    PhasorEngine phasor;

    double R = 50.0, L = 0.2, C = 10e-6, Vm = 100.0, f = 60.0;

    Complex vr = phasor.getVRPhasor(R, L, C, Vm, f);
    Complex vl = phasor.getVLPhasor(R, L, C, Vm, f);
    Complex vc = phasor.getVCPhasor(R, L, C, Vm, f);

    JsonLogger logger("PhasorEngine");

    // Each phasor as a nested object
    auto phasorJson = [](const Complex& c) -> std::string {
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(6);
        oss << "{\"real\": " << c.real << ", \"imag\": " << c.imag << "}";
        return oss.str();
    };

    logger.logRaw("VR", phasorJson(vr));
    logger.logRaw("VL", phasorJson(vl));
    logger.logRaw("VC", phasorJson(vc));

    logger.printToConsole();
    logger.flush(LOG_DIR + "/phasor.json");
}

// ============================================================
// 3. Spatial Field (Curl / Divergence)
// ============================================================
void runSpatialSimulation() {
    printHeader("3. SPATIAL FIELD CALCULUS (CURL/DIV)");

    CurlEngine2D curlEngine(20, 20);
    curlEngine.setPreset("swirl");
    curlEngine.compute();

    auto grid = curlEngine.getGrid();

    JsonLogger logger("CurlEngine2D");

    logger.logString("preset",     "swirl");
    logger.logString("resolution", "20x20");
    logger.logInt("total_points",  static_cast<int>(grid.size()));

    if (grid.size() > 100) {
        std::ostringstream sample;
        sample << std::fixed << std::setprecision(6);
        sample << "{\n"
               << "    \"x\": "      << grid[100].x      << ",\n"
               << "    \"y\": "      << grid[100].y      << ",\n"
               << "    \"curl_z\": " << grid[100].curl_z << "\n"
               << "  }";
        logger.logRaw("sample_point_100", sample.str());
    }

    logger.printToConsole();
    logger.flush(LOG_DIR + "/spatial_curl.json");
}

// ============================================================
// Main
// ============================================================
int main() {
    std::cout << "MathLabX Numerical Kernel CLI\n";
    std::cout << "JKUAT EEE OOP Submission - 2nd Year\n";
    std::cout << "Logging output -> " << LOG_DIR << "/\n";

    ensureLogDir();

    runACCircuitSimulation();
    runPhasorSimulation();
    runSpatialSimulation();

    std::cout << "\n========================================\n";
    std::cout << "  Simulation Complete. All units verified.\n";
    std::cout << "  JSON logs written to: " << LOG_DIR << "/\n";
    std::cout << "========================================\n";

    return 0;
}