#!/bin/bash
# Save as: ~/Documents/projects/MathlabX/scripts/emsdk-maintain.sh
# Purpose: Self-healing maintenance for Emscripten issues (Windows/batch version)

set -e

MATHLAB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$MATHLAB_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
EMSDK_PATH="${EMSDK_PATH:-$HOME/emsdk}"
EM_BAT="$EMSDK_PATH/upstream/emscripten/em++.bat"
LOG_FILE="$MATHLAB_ROOT/.emsdk_maintain.log"

log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

check_emscripten_health() {
    local issues=0
    
    log "${BLUE}🔍 Checking Emscripten health...${NC}"
    
    # Check 1: Does em++.bat exist?
    if [ ! -f "$EM_BAT" ]; then
        log "${RED}✗ em++.bat not found at $EM_BAT${NC}"
        issues=$((issues + 1))
    else
        log "${GREEN}✓ em++.bat found${NC}"
    fi
    
    # Check 2: Can we execute em++.bat?
    if [ -f "$EM_BAT" ]; then
        if cmd /c "$EM_BAT" --version 2>/dev/null | grep -q "emcc"; then
            log "${GREEN}✓ em++.bat is executable${NC}"
        else
            log "${YELLOW}⚠ em++.bat may not be working${NC}"
            issues=$((issues + 1))
        fi
    fi
    
    # Check 3: Python working?
    if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
        log "${RED}✗ Python not found in PATH${NC}"
        issues=$((issues + 1))
    else
        log "${GREEN}✓ Python found${NC}"
    fi
    
    # Check 4: Acorn module exists?
    if [ ! -d "$EMSDK_PATH/upstream/emscripten/tools/node_modules/acorn" ]; then
        log "${YELLOW}⚠ Acorn module missing${NC}"
        issues=$((issues + 1))
    else
        log "${GREEN}✓ Acorn module present${NC}"
    fi
    
    # Check 5: Emscripten cache healthy?
    if [ ! -d "$EMSDK_PATH/upstream/emscripten/cache" ]; then
        log "${YELLOW}⚠ Emscripten cache missing${NC}"
        issues=$((issues + 1))
    else
        log "${GREEN}✓ Cache present${NC}"
    fi
    
    return $issues
}

fix_acorn_issue() {
    log "${BLUE}📦 Fixing acorn dependencies...${NC}"
    
    local emscripten_tools="$EMSDK_PATH/upstream/emscripten/tools"
    
    if [ ! -d "$emscripten_tools" ]; then
        log "${RED}✗ Emscripten tools not found${NC}"
        return 1
    fi
    
    cd "$emscripten_tools"
    
    # Install acorn using npm (Windows-compatible)
    log "Installing acorn and acorn-walk..."
    if command -v npm &> /dev/null; then
        npm install acorn acorn-walk --save --no-package-lock --quiet 2>/dev/null
        log "${GREEN}✓ Acorn installed${NC}"
        return 0
    else
        log "${RED}✗ npm not found. Install Node.js first.${NC}"
        return 1
    fi
}

fix_python_issue() {
    log "${BLUE}🐍 Fixing Python configuration...${NC}"
    
    # Find actual Python path on Windows
    local python_paths=(
        "/c/Users/$USER/AppData/Local/Programs/Python/Python312/python.exe"
        "/c/Users/$USER/AppData/Local/Programs/Python/Python313/python.exe"
        "/c/Python312/python.exe"
        "/c/Python313/python.exe"
    )
    
    local found_python=""
    for py in "${python_paths[@]}"; do
        if [ -f "$py" ]; then
            found_python="$py"
            break
        fi
    done
    
    if [ -n "$found_python" ]; then
        # Set environment variables for current session
        export EMSDK_PYTHON="$found_python"
        export PYTHON="$found_python"
        
        # Create a Windows batch wrapper
        cat > "$MATHLAB_ROOT/scripts/set-python.bat" << EOF
@echo off
REM Auto-generated Python wrapper for MathlabX
set EMSDK_PYTHON=$found_python
set PYTHON=$found_python
echo ✓ Python set to $found_python
EOF
        
        log "${GREEN}✓ Python configured: $found_python${NC}"
        return 0
    else
        log "${RED}✗ No Python installation found${NC}"
        return 1
    fi
}

fix_environment() {
    log "${BLUE}🔧 Creating environment setup script...${NC}"
    
    # Create a Windows batch script to load Emscripten environment
    cat > "$MATHLAB_ROOT/scripts/wasm-env.bat" << EOF
@echo off
REM MathlabX WASM Environment Loader
set EMSDK=$HOME/emsdk
set PATH=%EMSDK%;%EMSDK%\\upstream\\emscripten;%PATH%
set EMSDK_PYTHON=$PYTHON
set PYTHON=$PYTHON
echo ✓ WASM environment ready
EOF

    # Create bash version as well
    cat > "$MATHLAB_ROOT/scripts/wasm-env.sh" << EOF
#!/bin/bash
# MathlabX WASM Environment Loader
export EMSDK="$HOME/emsdk"
export PATH="\$EMSDK:\$EMSDK/upstream/emscripten:\$PATH"
export EMSDK_PYTHON="$PYTHON"
export PYTHON="$PYTHON"
echo "✓ WASM environment ready"
EOF
    
    chmod +x "$MATHLAB_ROOT/scripts/wasm-env.sh"
    log "${GREEN}✓ Environment scripts created${NC}"
}

auto_fix() {
    log "${BLUE}🔧 Running auto-repair...${NC}"
    
    local fixes=0
    
    # Fix Python
    if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
        if fix_python_issue; then
            fixes=$((fixes + 1))
        fi
    fi
    
    # Fix acorn
    if [ ! -d "$EMSDK_PATH/upstream/emscripten/tools/node_modules/acorn" ]; then
        if fix_acorn_issue; then
            fixes=$((fixes + 1))
        fi
    fi
    
    # Create environment scripts
    fix_environment
    
    log "${GREEN}✓ Auto-repair complete. Made $fixes fixes.${NC}"
    log "${YELLOW}⚠️  Remember to run: source scripts/wasm-env.sh (bash) or scripts/wasm-env.bat (cmd)${NC}"
}

# Fix the makefile duplicate target issue
fix_makefile() {
    log "${BLUE}🔧 Fixing Makefile duplicates...${NC}"
    
    # Backup makefile
    cp Makefile Makefile.backup
    
    # Remove duplicate wasm target (lines 159 and 270)
    sed -i '/^wasm: maintain-check$/,/^$/d' Makefile
    sed -i '/^maintain-check:/,/^$/d' Makefile
    
    # Add proper wasm target at the end
    cat >> Makefile << 'EOF'

# Maintenance integration - fix duplicates
wasm: ensure-dirs $(WASM_TARGET)
	@echo "$(GREEN)✓ WebAssembly build complete!$(NC)"

maintain:
	@echo "$(BLUE)🔧 Running maintenance...$(NC)"
	@./scripts/emsdk-maintain.sh check

check-wasm:
	@./scripts/emsdk-maintain.sh check

fix-wasm:
	@./scripts/emsdk-maintain.sh fix

reset-wasm:
	@./scripts/emsdk-maintain.sh reset

EOF
    
    log "${GREEN}✓ Makefile fixed${NC}"
}

main() {
    local command="${1:-check}"
    
    case "$command" in
        check)
            check_emscripten_health
            exit $?
            ;;
        fix)
            auto_fix
            ;;
        fix-makefile)
            fix_makefile
            ;;
        env)
            echo "To use WASM build, first run:"
            echo "  Bash: source scripts/wasm-env.sh"
            echo "  CMD:  scripts\\wasm-env.bat"
            ;;
        clean)
            log "${BLUE}🧹 Cleaning maintenance files...${NC}"
            rm -f "$MATHLAB_ROOT/scripts/wasm-env.sh"
            rm -f "$MATHLAB_ROOT/scripts/wasm-env.bat"
            rm -f "$MATHLAB_ROOT/scripts/set-python.bat"
            rm -f "$MATHLAB_ROOT/.emsdk_maintain.log"
            log "${GREEN}✓ Clean complete${NC}"
            ;;
        *)
            echo "Emscripten Maintenance Script for MathlabX (Windows/batch version)"
            echo ""
            echo "Usage: ./scripts/emsdk-maintain.sh [command]"
            echo ""
            echo "Commands:"
            echo "  check         - Check for issues"
            echo "  fix           - Auto-repair issues"
            echo "  fix-makefile  - Fix duplicate targets in Makefile"
            echo "  env           - Show how to set up environment"
            echo "  clean         - Remove generated files"
            echo ""
            echo "Quick fix:"
            echo "  ./scripts/emsdk-maintain.sh fix"
            echo "  source scripts/wasm-env.sh"
            echo "  make wasm"
            ;;
    esac
}

# Create scripts directory
mkdir -p "$MATHLAB_ROOT/scripts"

# Run main
main "$@"