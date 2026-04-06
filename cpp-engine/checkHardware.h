#ifndef CHECK_HARDWARE_H
#define CHECK_HARDWARE_H

#include <iostream>

#ifdef __EMSCRIPTEN__
// WebAssembly version
inline unsigned int getCoreCount() { return 1; }
inline bool hasAVXSupport() { return false; }
inline double getCpuFrequency() { return 0.0; }
#else
#include <thread>
#ifdef __x86_64__
#include <cpuid.h>
#endif

inline unsigned int getCoreCount() {
    unsigned int cores = std::thread::hardware_concurrency();
    return cores > 0 ? cores : 1;
}

inline bool hasAVXSupport() {
#ifdef __x86_64__
    unsigned int eax, ebx, ecx, edx;
    __get_cpuid(1, &eax, &ebx, &ecx, &edx);
    return (ecx & bit_AVX) != 0;
#else
    return false;
#endif
}

inline double getCpuFrequency() {
    std::ifstream cpuinfo("/proc/cpuinfo");
    std::string line;
    while (std::getline(cpuinfo, line)) {
        if (line.find("cpu MHz") != std::string::npos) {
            size_t pos = line.find(":");
            return std::stod(line.substr(pos + 1));
        }
    }
    return 0.0;
}
#endif

inline void checkHardware() {
    std::cout << "System Cores: " << getCoreCount() << std::endl;
    if (hasAVXSupport()) {
        std::cout << "Hardware supports AVX (256-bit SIMD)." << std::endl;
    } else {
        std::cout << "Falling back to Standard Scalar math." << std::endl;
    }
}

#endif // CHECK_HARDWARE_H
