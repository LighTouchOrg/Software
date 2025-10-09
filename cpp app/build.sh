#!/bin/bash

# Build script for LighTouch C++ application

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== LighTouch Build Script ===${NC}"
echo ""

# Add MinGW to PATH if on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    if [ -d "/c/MinGW/bin" ]; then
        export PATH="/c/MinGW/bin:$PATH"
        echo -e "${GREEN}✓ Added MinGW to PATH${NC}"
    fi
fi

# Check for g++
if ! command -v g++ &> /dev/null; then
    echo -e "${RED}Error: g++ compiler not found${NC}"
    echo "Please install MinGW or add it to PATH"
    exit 1
fi

echo -e "${GREEN}✓ Compiler: $(g++ --version | head -1)${NC}"

# Check for CMake
if ! command -v cmake &> /dev/null; then
    echo -e "${RED}Error: CMake not found${NC}"
    echo "Please install CMake 3.16 or later"
    exit 1
fi

echo -e "${GREEN}✓ CMake: $(cmake --version | head -1)${NC}"

# Check for Qt6 (optional if Qt6_DIR is set)
if [ -z "$Qt6_DIR" ]; then
    if command -v qmake6 &> /dev/null || command -v qmake &> /dev/null; then
        echo -e "${GREEN}✓ Qt6 found in PATH${NC}"
    else
        echo -e "${YELLOW}⚠ WARNING: Qt6 not found${NC}"
        echo ""
        echo "Attempting build anyway. If it fails, install Qt6:"
        echo "  https://www.qt.io/download-qt-installer"
        echo ""
        echo "Or set Qt6_DIR manually:"
        echo "  export Qt6_DIR=/c/Qt/6.8.0/mingw_64"
        echo ""
    fi
else
    echo -e "${GREEN}✓ Qt6_DIR: $Qt6_DIR${NC}"
fi

echo ""

# Create build directory
if [ -d "build" ]; then
    echo -e "${YELLOW}Removing existing build directory...${NC}"
    rm -rf build
fi

mkdir -p build
cd build

# Configure
echo -e "${GREEN}Configuring project...${NC}"
cmake ..

# Build
echo -e "${GREEN}Building project...${NC}"
cmake --build . -j$(nproc 2>/dev/null || echo 4)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful!${NC}"
    echo -e "${GREEN}Executable: $(pwd)/LighTouch${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
