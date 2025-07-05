# Makefile for Matchmaking Service

# Detectar el sistema operativo
UNAME_S := $(shell uname -s)

# Compiler
CXX = g++

# Compiler flags
CXXFLAGS = -std=c++17 -Wall -Wextra -O2 -I.

# Libraries
ifeq ($(UNAME_S), Linux)
    LIBS = -lpthread
else ifeq ($(UNAME_S), Darwin)
    LIBS = -lpthread
else
    LIBS = -lws2_32
endif

# Source files
SRCDIR = src
LIBDIR = libs
BUILDDIR = build

# Source files
SOURCES = main.cpp $(SRCDIR)/matchmaking_service.cpp $(SRCDIR)/game_engine_reconnector.cpp

# Object files
OBJECTS = $(SOURCES:%.cpp=$(BUILDDIR)/%.o)

# Target executable
TARGET = $(BUILDDIR)/matchmaking_service

# Default target
all: $(TARGET)

# Create build directory
$(BUILDDIR):
	mkdir -p $(BUILDDIR)
	mkdir -p $(BUILDDIR)/$(SRCDIR)

# Build target
$(TARGET): $(BUILDDIR) $(OBJECTS)
	$(CXX) $(OBJECTS) -o $(TARGET) $(LIBS)

# Compile source files
$(BUILDDIR)/%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Clean build files
clean:
	rm -rf $(BUILDDIR)

# Run the application
run: $(TARGET)
	$(TARGET)

# Install dependencies (for Ubuntu/Debian)
install-deps:
	@echo "Installing dependencies for Ubuntu/Debian..."
	sudo apt update
	sudo apt install -y build-essential nlohmann-json3-dev

.PHONY: all clean run install-deps
