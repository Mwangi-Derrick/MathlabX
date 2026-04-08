#ifndef THEOREMS_H
#define THEOREMS_H

#include "curl.h"
#include <vector>

struct TheoremResult {
    double lineIntegral;    // ∮ F · dr around the boundary
    double areaIntegral;    // ∬ (curl_z) dA over the interior
    bool matches;           // Within numerical tolerance
};

/**
 * TheoremEngine — Demo for Green's Theorem (Vector Calc 1)
 */
class TheoremEngine : public CurlEngine2D {
public:
    TheoremEngine(int rx = 20, int ry = 20,
                  double xmin = -5.0, double xmax = 5.0,
                  double ymin = -5.0, double ymax = 5.0);

    /**
     * verifyGreensTheorem — Computes both sides of Green's Theorem for a rectangle.
     * ∮ (P dx + Q dy) = ∬ (∂Q/∂x - ∂P/∂y) dA
     */
    TheoremResult verifyGreensTheorem(double x0, double y0, double x1, double y1);

private:
    double computeBoundaryIntegral(double x0, double y0, double x1, double y1);
    double computeAreaIntegral(double x0, double y0, double x1, double y1);
};

#endif // THEOREMS_H
