#!/usr/bin/env bash
# Build the I650 emulator as a WASM module for the browser.
#
# Prerequisites: Emscripten SDK (emsdk) must be installed and activated.
#
# Usage:
#   ./scripts/build-wasm.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SIMH_DIR="$PROJECT_DIR/simh"
BUILD_DIR="$SIMH_DIR/emscripten-build"

echo "=== Building I650 WASM module ==="

# Touch preload stamp so preloaded filesystem data rebuilds when tests change.
touch "$SIMH_DIR/I650/tests/.preload-stamp"

# Reconfigure cmake (picks up toolchain changes)
cd "$BUILD_DIR"
rm -f CMakeCache.txt
cmake -DCMAKE_TOOLCHAIN_FILE="$SIMH_DIR/cmake/emscripten-wasm.cmake" "$SIMH_DIR"

# Force relink so preloaded filesystem data refreshes (tests/sw changes).
rm -f "$SIMH_DIR/BIN/i650.data"

# Build the i650 target
make i650

# Copy artifacts to public/
echo "=== Copying build artifacts to public/ ==="
cp "$SIMH_DIR/BIN/i650.js"   "$PROJECT_DIR/public/"
cp "$SIMH_DIR/BIN/i650.wasm" "$PROJECT_DIR/public/"
cp "$SIMH_DIR/BIN/i650.data" "$PROJECT_DIR/public/"

echo "=== Done ==="
ls -lh "$PROJECT_DIR/public/i650.js" "$PROJECT_DIR/public/i650.wasm" "$PROJECT_DIR/public/i650.data"
