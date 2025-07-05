#pragma once

#include <iostream>
#include <vector>
#include <unordered_map>
#include <thread>
#include <mutex>
#include <queue>
#include <memory>
#include <condition_variable>
#include <atomic>
#include <string>
#include <functional>
#include <cstdlib>
#include <chrono>

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
    #define SOCKET int
    #define INVALID_SOCKET -1
    #define SOCKET_ERROR -1
    #define closesocket close
#endif

#include <nlohmann/json.hpp>

using json = nlohmann::json;

// Estructura para representar un servidor de juego activo
struct GameServer {
    std::string ip;
    int port;
    std::vector<int> playerIds;
    std::vector<int> barajasIds;  // IDs de las barajas confirmadas
    bool active;
    
    GameServer(const std::string& ip, int port, const std::vector<int>& players, 
               const std::vector<int>& barajasIds) 
        : ip(ip), port(port), playerIds(players), active(true) {}
};

// Estructura para representar un jugador en espera
struct WaitingPlayer {
    int playerId;
    std::string ip;
    int barajaId;  // ID de la baraja confirmada
    std::chrono::steady_clock::time_point joinTime;
    
    WaitingPlayer(int id, const std::string& playerIp, int baraja) 
        : playerId(id), ip(playerIp),barajaId(barajaId), joinTime(std::chrono::steady_clock::now()) {}
};

// Estructura para almacenar información de conexión del jugador
struct PlayerConnection {
    int playerId;
    std::string ip;
    int barajaId;
    SOCKET socket;
    std::chrono::steady_clock::time_point lastSeen;
    bool isConnected;
    
    PlayerConnection(int id, const std::string& playerIp,int baraja, SOCKET clientSocket) 
        : playerId(id), ip(playerIp), barajaId(baraja), socket(clientSocket), 
          lastSeen(std::chrono::steady_clock::now()), isConnected(true) {}
};

// Servicio de matchmaking independiente
class MatchmakingService {
public:
    // Singleton pattern
    static MatchmakingService& getInstance() {
        static MatchmakingService instance;
        return instance;
    }

    // Inicializar el servicio
    void initialize();
    
    // Iniciar el servidor en un puerto específico
    void run(int port);
    
    // Detener el servicio
    void shutdown();
    json confirmDeck(int playerId, const std::string& playerIp, int barajaId);
    // Solicitar unirse a una partida
    json joinMatch(int playerId, const std::string& playerIp, int barajaId);
    
    // Salir de la cola de matchmaking o partida activa
    json leaveMatch(int playerId);
    
    // Obtener información de partida en curso para reconexión
    json getActiveMatch(int playerId);
    
    // Notificar que una partida terminó
    void notifyMatchEnded(int matchId);

private:
    // Constructor privado para singleton
    MatchmakingService();
    ~MatchmakingService();

    // Funciones auxiliares
    void handleClientConnection(SOCKET clientSocket);
    json processRequest(const json& request, const std::string& clientIp);
    
    // Manejo de peticiones HTTP
    json handleHttpRequest(const std::string& httpRequest, const std::string& clientIp);
    void sendHttpResponse(SOCKET clientSocket, const json& jsonResponse);
    
    // Crear una nueva partida en el game engine
    json createGameServer(const std::vector<int>& playerIds, const std::vector<std::string>& playerIps,const std::vector<int>& barajasIds);
    
    // Comunicación con game engine via socket
    json sendToGameEngine(const json& message);
    
    // Notificar a jugadores específicos sobre match encontrado
    void notifyPlayersMatchFound(const std::vector<int>& playerIds, int matchId, 
                                const std::string& serverIp, int serverPort);
    
    // Verificar estado de conexión de jugadores y manejar reconexiones
    void checkPlayerConnections();
    
    // Enviar mensaje a un jugador específico
    bool sendMessageToPlayer(int playerId, const json& message);
    
    // Gestión de socket del servidor
    void startSocketServer(int port);
    
    // Datos del servicio
    std::vector<WaitingPlayer> waitingPlayers;
    std::unordered_map<int, std::shared_ptr<GameServer>> activeMatches;  // matchId -> GameServer
    std::unordered_map<int, int> playerToMatch;  // playerId -> matchId
    
    // Conexiones activas de jugadores para notificaciones
    std::unordered_map<int, std::shared_ptr<PlayerConnection>> playerConnections;  // playerId -> PlayerConnection
    
    // Thread safety
    std::mutex mutex;
    
    // ID generators
    int nextMatchId = 1;
    
    // Socket del servidor
    SOCKET serverSocket;
    bool isRunning = false;
    
    // Configuración del game engine
    std::string gameEngineIp = "127.0.0.1";
    int gameEnginePort = 9003;  // Puerto para comunicación con game engine
    
    // Configuración
    int playersPerMatch = 2;
    int maxWaitingTime = 60;  // segundos
};
