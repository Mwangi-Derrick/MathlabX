@echo off
REM MathlabX WASM Environment Loader
set EMSDK=/c/Users/user/emsdk
set PATH=%EMSDK%;%EMSDK%\upstream\emscripten;%PATH%
set EMSDK_PYTHON=
set PYTHON=
echo ✓ WASM environment ready
