# MathlabX
AC &amp; Vector Field Simulator for EEE Students

## **🚀 Project Description**

MathLabX is a **high-performance, interactive simulation engine** built to bridge the gap between theoretical **Electromagnetics**, **Vector Calculus**, and **Object-Oriented Programming (C++)**. By compiling a C++ numerical kernel to **WebAssembly (Wasm)**, MathLabX allows students and engineers to **visualize fields, AC signals, and vector behaviors in real-time**, directly in the browser.

The project demonstrates how **abstract EEE concepts** like phasors, field superposition, and AC amplitudes can be translated into **dynamic, interactive simulations**, making the math **intuitive and engaging**.

* * *

## **💡 Purpose / Motivation**

Traditional EEE courses rely heavily on **paper calculations and static diagrams**, making it hard to internalize **electromagnetic field behavior and vector calculus operations**. MathLabX:

-   Provides a **visual, real-time representation** of vector fields and AC signals.
-   Acts as a **learning companion** to EEE units like 2.2 Electromagnetics.
-   Serves as a **platform for further extensions**, such as multiple charges, divergence, curl visualization, and phasor animations.

* * *

## **🛠️ Features**

-   **AC Signal Simulation** – Visualize sine and cosine waveforms, calculate Vmax, Vrms, and instantaneous values.
-   **Interactive Vector Field** – Place virtual charges and see the field vectors update in real-time.
-   **High-Performance Backend** – Written in **C++**, compiled to **Wasm** for near-native browser speed.
-   **Dynamic UI Controls** – Sliders for frequency, amplitude, phase, and charge parameters.
-   **Extensible Kernel** – Easily add more physics concepts, like curl, divergence, or multi-charge superposition.
-   **Educational Focus** – Each simulation corresponds to real EEE formulas for **AC circuits, Vector Calculus, and Electromagnetics**.

* * *

## **⚙️ Tech Stack**

| Layer | Technology | Purpose |
| --- | --- | --- |
| Numerical Kernel | C++ (RAII, operator overloading) | Implements physics calculations (Vector2D, Phasors, Coulomb Law) |
| Browser Bridge | **Emscripten / Embind** | Compiles C++ to Wasm, exposes classes to JS/React |
| Frontend | React + HTML5 Canvas | Interactive visualizations & controls |
| Build | em++ -O3 --bind -s WASM=1 | Optimized WebAssembly compilation |

* * *

## **📈 Usage**

1.  Clone the repository:

git clone https://github.com/Mwangi-Derrick/MathLabX.git  
cd MathLabX

2.  Build the C++ Wasm engine:

em++ \-O3 \--bind \-s WASM\=1 \-o engine.js engine.cpp

3.  Launch the frontend (React dev server):

npm install  
npm start

4.  Open the browser at `http://localhost:3000` and interact with the simulation:

-   Move charges
-   Adjust sliders for frequency, amplitude, and phase
-   Watch vectors and waveforms update in real-time

* * *

## **🧩 Extensibility Ideas**

-   Multi-charge field superposition
-   Equipotential lines / scalar fields
-   Complex phasor animations for AC circuits
-   Real-time divergence and curl visualization
-   3D vector field support
