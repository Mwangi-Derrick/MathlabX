#include <iostream>

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

