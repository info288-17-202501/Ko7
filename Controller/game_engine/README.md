# Orquestador de Partidas (C++)

Este proyecto implementa un orquestador simple de partidas para un sistema distribuido de juegos utilizando C++.

## Componentes


### Core del Sistema
1. **main.cpp**: Punto de entrada principal del game engine
2. **orchestrator.hpp/cpp**: Orquestador principal que gestiona la asignación de jugadores a partidas y distribución entre hilos
3. **game_thread.hpp/cpp**: Hilos especializados que gestionan múltiples partidas simultáneamente
4. **match.hpp/cpp**: Lógica de partidas individuales y manejo de desconexiones

### Comunicación y Red
5. **matchmaking_handler.hpp/cpp**: Interfaz de comunicación con el servicio de matchmaking¿
6. **game_websocket_server.hpp/cpp**: Servidores WebSocket específicos por partida (Puerto 10000+)

### Utilidades
8. **load_env_file.cpp**: Cargador de variables de entorno desde archivo .env


## Características

- **Gestión automática de partidas**: Asignación inteligente de jugadores
- **Sistema multi-hilo**: Distribución eficiente de partidas entre hilos
- **WebSockets por partida**: Cada partida tiene su propio servidor WebSocket
- **Manejo de desconexiones**: Reconexión automática y persistencia de estado
- **Validación de IPs**: Solo jugadores autorizados pueden conectarse
- **Monitoreo en tiempo real**: Logs detallados y estadísticas
- **Multiplataforma**: Compatible con Windows y Linux

## Compilación y Uso

### Automática (Recomendado)
```bash
# Usar el makefile inteligente que detecta el sistema operativo
make clean && make

# O usar el script de automatización
./run_system.sh  # Opción 1: Compilar todo
```
### Manual
```bash
# Ubuntu/Linux
g++ -std=c++17 -pthread -Wall -Wextra -O2 -Ilibs -I. \
    main.cpp src/orchestrator.cpp src/game_thread.cpp src/match.cpp \
    src/websocket_manager.cpp src/matchmaking_handler.cpp \
    src/game_websocket_server.cpp -o game_orchestrator -lpthread

# Windows (MinGW)
g++ -std=c++17 -Wall -Wextra -O2 -Ilibs -I. \
    main.cpp src/orchestrator.cpp src/game_thread.cpp src/match.cpp \
    src/websocket_manager.cpp src/matchmaking_handler.cpp \
    src/game_websocket_server.cpp -o game_orchestrator.exe -lws2_32
```
## 🚀 Ejecución

### Sistema Completo
```bash
# Ejecutar todo el sistema automáticamente
./run_system.sh  # Opción 5: Ejecutar sistema completo

# O ejecutar componentes individuales
./run_system.sh  # Opción 3: Solo Game Engine
```

### Manual
```bash
# Ejecutar solo el Game Engine
./game_orchestrator
# Con variables de entorno personalizadas
SERVER_PORT=9003 MATCHMAKING_IP=127.0.0.1 ./game_orchestrator
```


## Configuración

### Variables de Entorno (.env)
```bash

# Configuración del Matchmaking Service
MATCHMAKING_IP=127.0.0.1
SERVER_PORT=9001

# Puerto base para servidores WebSocket de partidas
BASE_GAME_PORT=10000
MAX_GAME_PORT=11000

# Configuración de hilos
MAX_THREADS=4
MAX_MATCHES_PER_THREAD=5
```
## Requisitos

- Compilador compatible con C++17
- Soporte para threading (pthread o similar)


## Instrucciones para ejecutar la integración C++ con JavaScript

### Requisitos previos

1. **Bibliotecas necesarias para C++**:
   - websocketpp (biblioteca header-only para WebSockets)
   - nlohmann/json (biblioteca para manejo de JSON)
   - Compilador compatible con C++17

### Pasos de instalación

#### 1. Instalar bibliotecas necesarias

##### Para Windows con vcpkg (recomendado):

```powershell
vcpkg install websocketpp:x64-windows
vcpkg install nlohmann-json:x64-windows
```

##### Para Ubuntu/WSL:

```bash
# Instalar herramientas de compilación y bibliotecas
sudo apt update
sudo apt install build-essential cmake libboost-all-dev git

# Instalar nlohmann/json
sudo apt install nlohmann-json3-dev

# Instalar websocketpp desde el código fuente dentro de la carpeta libs
cd libs
git clone https://github.com/zaphoyd/websocketpp.git
cd websocketpp
mkdir build
cd build
cmake ..
sudo make install
cd ../../..
```

##### O usando CMake:

```powershell
# Clonar las bibliotecas si no se tiene un gestor de paquetes
git clone https://github.com/zaphoyd/websocketpp.git
git clone https://github.com/nlohmann/json.git

# Luego agregar sus rutas al include path