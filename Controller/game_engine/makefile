# Makefile para el proyecto de orquestador de juegos

# Detectar el sistema operativo
UNAME_S := $(shell uname -s 2>/dev/null || echo Windows)

# Compilador y opciones
CXX = g++
CXXFLAGS = -std=c++17 -pthread -Wall -Wextra -O2

# Directorios del proyecto
SRC_DIR = src
INCLUDE_DIR = libs
BUILD_DIR = build

# Incluir directorios
INCLUDES = -I$(INCLUDE_DIR) -I.

# Bibliotecas según el sistema operativo
ifeq ($(UNAME_S), Linux)
    LIBS = -lpthread
    EXECUTABLE = game_orchestrator
else ifeq ($(UNAME_S), Darwin)
    LIBS = -lpthread  
    EXECUTABLE = game_orchestrator
else
    LIBS = -lboost_system -lws2_32
    EXECUTABLE = game_orchestrator.exe
endif

# Archivos fuente
MAIN = main.cpp
SOURCES = $(SRC_DIR)/orchestrator.cpp $(SRC_DIR)/game_thread.cpp $(SRC_DIR)/match.cpp $(SRC_DIR)/matchmaking_handler.cpp $(SRC_DIR)/game_websocket_server.cpp
ALL_SOURCES = $(MAIN) $(SOURCES)

# Puerto para el servidor web
WEB_PORT = 8000

# Crear directorio de build si no existe
$(shell mkdir -p $(BUILD_DIR) 2>/dev/null || mkdir $(BUILD_DIR) 2>nul)

# Regla principal
all: $(EXECUTABLE)

# Compilar el ejecutable
$(EXECUTABLE): $(ALL_SOURCES)
	@echo "Compilando orquestador de juegos..."
	$(CXX) $(CXXFLAGS) $(INCLUDES) $(ALL_SOURCES) -o $@ $(LIBS)
	@echo "Compilación exitosa."
ifeq ($(UNAME_S), Linux)
	chmod +x $(EXECUTABLE)
endif

# Ejecutar el servidor del juego
run: $(EXECUTABLE)
	@echo "Iniciando el servidor del juego..."
	./$(EXECUTABLE)

# Iniciar el servidor web para el cliente en segundo plano (solo Linux/Mac)
web:
ifeq ($(UNAME_S), Linux)
	@echo "Iniciando servidor web en puerto $(WEB_PORT)..."
	@echo "Abre http://localhost:$(WEB_PORT)/juego_jugador.html en tu navegador."
	python3 -m http.server $(WEB_PORT)
else
	@echo "Servidor web no soportado en Windows desde este makefile"
endif

# Limpiar archivos compilados
clean:
ifeq ($(UNAME_S), Linux)
	rm -f $(EXECUTABLE)
	rm -rf $(BUILD_DIR)
else
	if exist $(EXECUTABLE) del $(EXECUTABLE)
	if exist $(BUILD_DIR) rmdir /s /q $(BUILD_DIR)
endif

# Instalar dependencias (Ubuntu/Debian)
install-deps:
ifeq ($(UNAME_S), Linux)
	@echo "Instalando dependencias para Ubuntu..."
	sudo apt update
	sudo apt install -y build-essential
	sudo apt install -y nlohmann-json3-dev
	@echo "Nota: websocketpp es header-only, se incluye en el proyecto"
else
	@echo "Instalación automática de dependencias solo soportada en Linux"
endif

# Información del sistema
info:
	@echo "Sistema operativo detectado: $(UNAME_S)"
	@echo "Compilador: $(CXX)"
	@echo "Flags: $(CXXFLAGS)"
	@echo "Bibliotecas: $(LIBS)"
	@echo "Ejecutable: $(EXECUTABLE)"

.PHONY: all clean run web install-deps info
start: $(EXECUTABLE)
	@echo "Iniciando servidor web en segundo plano..."
	python3 -m http.server $(WEB_PORT) & 
	@echo "Iniciando servidor de juego..."
	./$(EXECUTABLE)
	@echo "Deteniendo servidor web..."
	@pkill -f "python3 -m http.server $(WEB_PORT)" || true

# Detener servidores
stop:
	@echo "Deteniendo servidores..."
	@pkill -f "python3 -m http.server $(WEB_PORT)" || true
	@pkill -f "./$(EXECUTABLE)" || true

# Limpiar archivos generados
clean:
	@echo "Limpiando archivos generados..."
	rm -f $(EXECUTABLE)
	rm -rf $(BUILD_DIR)/*

# Ayuda
help:
	@echo "Opciones disponibles:"
	@echo "  make all       - Compilar el proyecto"
	@echo "  make run       - Ejecutar el servidor del juego"
	@echo "  make web       - Iniciar el servidor web para el cliente"
	@echo "  make start     - Iniciar ambos servidores (web en segundo plano)"
	@echo "  make stop      - Detener todos los servidores"
	@echo "  make clean     - Limpiar archivos generados"
	@echo ""
	@echo "Para jugar:"
	@echo "  1. Ejecuta 'make start' en una terminal"
	@echo "  2. Abre http://localhost:$(WEB_PORT)/juego_jugador.html en tu navegador"
	@echo "  3. Abre otra pestaña con la misma URL para el segundo jugador"

.PHONY: all run web start stop clean help