#pragma once

#include <iostream>
#include <string>
#include <thread>
#include <atomic>
#include <vector>
#include <mutex>

// Headers específicos según el sistema operativo
#ifdef _WIN32
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #pragma comment(lib, "ws2_32.lib")
    typedef int socklen_t;
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <arpa/inet.h>
    #include <unistd.h>
    #include <fcntl.h>
    #include <netdb.h>
    #include <cstring>
    #include <cerrno>
    #define SOCKET int
    #define INVALID_SOCKET -1
    #define SOCKET_ERROR -1
    #define closesocket close
#endif

#include <nlohmann/json.hpp>

using json = nlohmann::json;

// Manejador de comunicación con el servicio de matchmaking
class MatchmakingHandler {
public:
    // Singleton pattern
    static MatchmakingHandler& getInstance() {
        static MatchmakingHandler instance;
        return instance;
    }

    // Inicializar el handler
    void initialize();
    
    // Iniciar el servidor de comunicación con matchmaking
    void run(int port);
    
    // Detener el handler
    void shutdown();

private:
    // Constructor privado para singleton
    MatchmakingHandler();
    ~MatchmakingHandler();

    // Manejar conexión del matchmaking service
    void handleMatchmakingConnection(SOCKET clientSocket);
    
    // Procesar requests del matchmaking service
    json processMatchmakingRequest(const json& request);
    
    // Crear un nuevo servidor de juego en un puerto específico
    json createGameServer(int matchId, const std::vector<int>& playerIds, const std::vector<std::string>& playerIps,const std::vector<int>& barajasIds);
    
    // Encontrar un puerto disponible para el nuevo servidor
    int findAvailablePort();
    
    // Verificar si un puerto está disponible
    bool isPortAvailable(int port);
    
    // Socket del servidor
    SOCKET serverSocket;
    
    // Rango de puertos para servidores de juego
    int baseGamePort = 10000;
    int maxGamePort = 11000;
    
    bool isRunning = false;
    
    // Thread safety
    std::mutex mutex;
};
