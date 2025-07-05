#include "../libs/matchmaking_handler.hpp"
#include "../libs/orchestrator.hpp"
#include "../libs/game_websocket_server.hpp"
#include <thread>
#include <cstring>  // Para strerror
#include <cerrno>   // Para errno

// Headers específicos según el sistema operativo
#ifdef _WIN32
    #pragma comment(lib, "ws2_32.lib")
#endif

MatchmakingHandler::MatchmakingHandler() : serverSocket(INVALID_SOCKET), baseGamePort(10000), maxGamePort(11000), isRunning(false) {
    printf("MatchmakingHandler created\n");
    
    // Leer configuración desde variables de entorno
    const char* basePort = std::getenv("BASE_GAME_PORT");
    if (basePort != nullptr && std::stoi(basePort) > 0) {
        baseGamePort = std::stoi(basePort);
    }
    
    const char* maxPort = std::getenv("MAX_GAME_PORT");
    if (maxPort != nullptr && std::stoi(maxPort) > 0) {
        maxGamePort = std::stoi(maxPort);
    }
}

MatchmakingHandler::~MatchmakingHandler() {
    shutdown();
}

void MatchmakingHandler::initialize() {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (isRunning) {
        return;
    }
    
    printf("Initializing matchmaking handler\n");
    printf("Game server port range: %d - %d\n", baseGamePort, maxGamePort);
    
    isRunning = true;
}

void MatchmakingHandler::run(int port) {
    if (!isRunning) {
        printf("Handler not initialized\n");
        return;
    }
    
    // Crear socket del servidor
    serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (serverSocket == INVALID_SOCKET) {
#ifdef _WIN32
        printf("Error creating matchmaking socket: %d\n", WSAGetLastError());
#else
        printf("Error creating matchmaking socket: %s\n", strerror(errno));
#endif
        return;
    }
    
    // Permitir reutilizar la dirección
    int opt = 1;
    if (setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, 
#ifdef _WIN32
                   (char*)&opt, 
#else
                   &opt,
#endif
                   sizeof(opt)) < 0) {
        printf("Error setting socket options\n");
    }
    
    // Configurar dirección del servidor
    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(port);
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    
    // Bind del socket
    if (bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
#ifdef _WIN32
        printf("Matchmaking bind failed: %d\n", WSAGetLastError());
#else
        printf("Matchmaking bind failed: %s\n", strerror(errno));
#endif
        closesocket(serverSocket);
        return;
    }
    
    // Empezar a escuchar
    if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR) {
#ifdef _WIN32
        printf("Matchmaking listen failed: %d\n", WSAGetLastError());
#else
        printf("Matchmaking listen failed: %s\n", strerror(errno));
#endif
        closesocket(serverSocket);
        return;
    }
    
    printf("Matchmaking handler listening on port %d\n", port);
    
    // Loop principal para aceptar conexiones del matchmaking service
    while (isRunning) {
        sockaddr_in clientAddr;
#ifdef _WIN32
        int clientAddrSize = sizeof(clientAddr);
#else
        socklen_t clientAddrSize = sizeof(clientAddr);
#endif
        
        SOCKET clientSocket = accept(serverSocket, (sockaddr*)&clientAddr, &clientAddrSize);
        if (clientSocket == INVALID_SOCKET) {
            if (isRunning) {
#ifdef _WIN32
                printf("Matchmaking accept failed: %d\n", WSAGetLastError());
#else
                printf("Matchmaking accept failed: %s\n", strerror(errno));
#endif
            }
            continue;
        }
        
        // Manejar request del matchmaking service
        std::thread clientThread([this, clientSocket]() {
            handleMatchmakingConnection(clientSocket);
        });
        clientThread.detach();
    }
}

void MatchmakingHandler::shutdown() {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (!isRunning) {
        return;
    }
    
    printf("Shutting down matchmaking handler\n");
    
    // Cerrar socket del servidor
    if (serverSocket != INVALID_SOCKET) {
        closesocket(serverSocket);
        serverSocket = INVALID_SOCKET;
    }
    
    isRunning = false;
}

void MatchmakingHandler::handleMatchmakingConnection(SOCKET clientSocket) {
    char buffer[4096];
    
    try {
        // Recibir mensaje del matchmaking service
        int bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
        if (bytesReceived > 0) {
            buffer[bytesReceived] = '\0';
            
            // Parsear JSON request
            json request = json::parse(buffer);
            json response = processMatchmakingRequest(request);
            
            // Enviar respuesta
            std::string responseStr = response.dump();
            send(clientSocket, responseStr.c_str(), responseStr.length(), 0);
        }
    } catch (const std::exception& e) {
        printf("Error handling matchmaking request: %s\n", e.what());
        json errorResponse = {
            {"status", "error"},
            {"message", e.what()}
        };
        std::string responseStr = errorResponse.dump();
        send(clientSocket, responseStr.c_str(), responseStr.length(), 0);
    }
    
    closesocket(clientSocket);
}

json MatchmakingHandler::processMatchmakingRequest(const json& request) {
    std::string action = request["action"];
    
    if (action == "createMatch") {
        int matchId = request["matchId"];
        std::vector<int> playerIds = request["playerIds"];
        std::vector<std::string> playerIps = request["playerIps"];
        std::vector<int> barajasIds = request["barajasIds"];  // IDs de las barajas
        return createGameServer(matchId, playerIds, playerIps,barajasIds);
    }
    else {
        return json{
            {"status", "error"},
            {"message", "Unknown action: " + action}
        };
    }
}

json MatchmakingHandler::createGameServer(int matchId, const std::vector<int>& playerIds, const std::vector<std::string>& playerIps,const std::vector<int>& barajasIds) {
    printf("Creating game server for match %d\n", matchId);
    printf("Player IDs: ");
    for (int id : playerIds) {
        printf("%d ", id);
    }
    printf("\n");
    
    printf("Player IPs: ");
    for (const auto& ip : playerIps) {
        printf("[%s] ", ip.c_str());
    }
    printf("\n");
    
    // Encontrar puerto disponible
    int gamePort = findAvailablePort();
    if (gamePort == -1) {
        return json{
            {"status", "error"},
            {"message", "No available ports for game server"}
        };
    }
    
    // Crear la partida en el orchestrator con el matchId específico
    if (!Orchestrator::getInstance().createMatchWithId(matchId, playerIds[0], playerIds[1])) {
        return json{
            {"status", "error"},
            {"message", "Failed to create match in orchestrator"}
        };
    }
    
    // Crear nuevo GameWebSocketServer específico para esta partida
    printf("Creating GameWebSocketServer with allowed IPs: ");
    for (const auto& ip : playerIps) {
        printf("[%s] ", ip.c_str());
    }
    printf("\n");
    
    auto gameServer = std::make_shared<GameWebSocketServer>(matchId, playerIps);//ahora pasar barajas aqui
    gameServer->initialize();
    
    // Iniciar el servidor en un hilo separado
    std::thread gameThread([gameServer, gamePort]() {
        gameServer->run(gamePort);
    });
    gameThread.detach();
    
    printf("Game server created for match %d on port %d\n", matchId, gamePort);
    
    return json{
        {"status", "success"},
        {"matchId", matchId},
        {"serverIp", "127.0.0.1"},  // O la IP real del servidor
        {"serverPort", gamePort}
    };
}

int MatchmakingHandler::findAvailablePort() {
    for (int port = baseGamePort; port <= maxGamePort; port++) {
        if (isPortAvailable(port)) {
            return port;
        }
    }
    return -1;  // No hay puertos disponibles
}

bool MatchmakingHandler::isPortAvailable(int port) {
    SOCKET testSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (testSocket == INVALID_SOCKET) {
        return false;
    }
    
    sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);
    addr.sin_addr.s_addr = INADDR_ANY;
    
    bool available = (bind(testSocket, (sockaddr*)&addr, sizeof(addr)) != SOCKET_ERROR);
    closesocket(testSocket);
    
    return available;
}
