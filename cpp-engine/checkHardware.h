#include <iostream>
#include <fstream>
#include <string>

#ifdef __x86_64__
#include <cpuid.h> // For Intel/AMD hardware detection
#endif

using namespace std;

void checkHardware() {
    // 1. Detect Cores
    unsigned int cores = std::thread::hardware_concurrency();
    std::cout << "System Cores: " << cores << std::endl;

    // 2. Detect SIMD (Simplified logic)
    bool hasAVX = false;
#ifdef __x86_64__
    unsigned int eax, ebx, ecx, edx;
    __get_cpuid(1, &eax, &ebx, &ecx, &edx);
    hasAVX = (ecx & bit_AVX); 
#endif

    if (hasAVX) {
        std::cout << "Hardware supports AVX (256-bit SIMD)." << std::endl;
    } else {
        std::cout << "Falling back to Standard Scalar math." << std::endl;
    }
}


double getCpuFrequency() {
    std::ifstream cpuinfo("/proc/cpuinfo");
    std::string line;
    while (std::getline(cpuinfo, line)) {
        if (line.find("cpu MHz") != std::string::npos) {
            size_t pos = line.find(":");
            return std::stod(line.substr(pos + 1)); // Returns MHz
        }
    }
    return 0.0;
}

void printSystemCapability() {
    double mhz = getCpuFrequency();
    int cores = 2; // From your lscpu
    int simd_factor = 4; // For AVX2 doubles

    double peak = (mhz / 1000.0) * cores * simd_factor;
    
    std::cout << "Detected Clock: " << mhz << " MHz" << std::endl;
    std::cout << "Theoretical Peak (SIMD): " << peak << " GFLOPS" << std::endl;
}
