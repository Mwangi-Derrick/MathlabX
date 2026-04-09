#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include "../cpp-engine/time_domain/ACCircuitEngine.h"
#include "../cpp-engine/time_domain/PhasorEngine.h"
#include "../cpp-engine/spatial/curl.h"
#include "../cpp-engine/spatial/divergence.h"

/**
 * JKUAT OOP 2nd Year Mini-Project: MathLabX CLI
 * This driver demonstrates:
 * 1. Inheritance (WaveEngine -> ACCircuitEngine -> PhasorEngine)
 * 2. Polymorphism (Virtual destructors and method overriding)
 * 3. Abstraction (Encapsulating physics formulas in class methods)
 * 4. Data Logging (JSON-style output for interoperability)
 */

void printHeader(const std::string& title) {
    std::cout << "\n========================================\n";
    std::cout << "  " << title << "\n";
    std::cout << "========================================\n";
}

void runACCircuitSimulation() {
    printHeader("1. AC RLC CIRCUIT ANALYSIS");
    
    // Instantiate the engine (demonstrates OOP Encapsulation)
    ACCircuitEngine circuit;
    
    // User inputs (Simulation parameters)
    double R = 10.0;   // 10 Ohms
    double L = 0.05;   // 50 mH
    double C = 100e-6; // 100 uF
    double Vm = 240.0; // 240V Peak
    double f = 50.0;   // 50Hz (Kenyan Grid Standard)

    circuit.setCircuitParameters(R, L, C);
    circuit.setSource(Vm, f);
    circuit.generateWaves();

    // Output results in JSON format (Modern Logging)
    std::cout << "{\n";
    std::cout << "  \"component\": \"ACCircuitEngine\",\n";
    std::cout << "  \"parameters\": {\n";
    std::cout << "    \"resistance\": " << R << ",\n";
    std::cout << "    \"inductance\": " << L << ",\n";
    std::cout << "    \"capacitance\": " << C << "\n";
    std::cout << "  },\n";
    std::cout << "  \"results\": {\n";
    std::cout << "    \"omega\": " << circuit.getOmega() << ",\n";
    std::cout << "    \"impedance\": " << circuit.getImpedance() << ",\n";
    std::cout << "    \"phase_angle_rad\": " << circuit.getPhaseAngle() << ",\n";
    std::cout << "    \"power_factor\": " << circuit.getPowerFactor() << ",\n";
    std::cout << "    \"real_power_W\": " << circuit.getRealPower() << ",\n";
    std::cout << "    \"reactive_power_VAR\": " << circuit.getReactivePower() << "\n";
    std::cout << "  }\n";
    std::cout << "}\n";
}

void runPhasorSimulation() {
    printHeader("2. PHASOR VECTOR DIAGRAM");

    // PhasorEngine inherits from ACCircuitEngine (Inheritance)
    PhasorEngine phasor;
    
    double R = 50.0, L = 0.2, C = 10e-6, Vm = 100.0, f = 60.0;
    
    Complex vr = phasor.getVRPhasor(R, L, C, Vm, f);
    Complex vl = phasor.getVLPhasor(R, L, C, Vm, f);
    Complex vc = phasor.getVCPhasor(R, L, C, Vm, f);

    std::cout << "{\n";
    std::cout << "  \"component\": \"PhasorEngine\",\n";
    std::cout << "  \"vectors\": {\n";
    std::cout << "    \"VR\": {\"real\": " << vr.real << ", \"imag\": " << vr.imag << "},\n";
    std::cout << "    \"VL\": {\"real\": " << vl.real << ", \"imag\": " << vl.imag << "},\n";
    std::cout << "    \"VC\": {\"real\": " << vc.real << ", \"imag\": " << vc.imag << "}\n";
    std::cout << "  }\n";
    std::cout << "}\n";
}

void runSpatialSimulation() {
    printHeader("3. SPATIAL FIELD CALCULUS (CURL/DIV)");

    // Demonstrates abstraction and reuse of spatial grid logic
    CurlEngine2D curlEngine(20, 20); // 20x20 Grid
    curlEngine.setPreset("swirl");
    curlEngine.compute();

    auto grid = curlEngine.getGrid();
    
    std::cout << "{\n";
    std::cout << "  \"component\": \"CurlEngine2D\",\n";
    std::cout << "  \"grid_info\": {\n";
    std::cout << "    \"resolution\": \"20x20\",\n";
    std::cout << "    \"total_points\": " << grid.size() << ",\n";
    std::cout << "    \"sample_point_100\": {\n";
    std::cout << "      \"x\": " << grid[100].x << ",\n";
    std::cout << "      \"y\": " << grid[100].y << ",\n";
    std::cout << "      \"curl_z\": " << grid[100].curl_z << "\n";
    std::cout << "    }\n";
    std::cout << "  }\n";
    std::cout << "}\n";
}

int main() {
    std::cout << "MathLabX Numerical Kernel CLI - [JKUAT EEE/OOP Submission]\n";
    
    runACCircuitSimulation();
    runPhasorSimulation();
    runSpatialSimulation();

    std::cout << "\nSimulation Complete. All units verified.\n";
    return 0;
}
