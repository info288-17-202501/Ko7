#include "../libs/matchmaking_service.hpp"
#include <thread>
#include <chrono>
#include <sstream>
#include <cstring>  // Para strerror
#include <cerrno>   // Para errno
#include <set>      // Para validación de duplicados

// Headers específicos según el sistema operativo
#ifdef _WIN32
    #pragma comment(lib, "ws2_32.lib")
#endif

MatchmakingService::MatchmakingService() : serverSocket(INVALID_SOCKET), isRunning(false) {
    printf("MatchmakingService created\n");
    
    // Inicializar Winsock solo en Windows
#ifdef _WIN32
    WSADATA wsaData;
    int result = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (result != 0) {
        printf("WSAStartup failed: %d\n", result);
        return;
    }
#endif
    
    // Leer configuración desde variables de entorno
    const char* engineIp = std::getenv("GAME_ENGINE_IP");
    if (engineIp != nullptr) {
        gameEngineIp = engineIp;
    }
    
    const char* enginePort = std::getenv("GAME_ENGINE_PORT");
    if (enginePort != nullptr && std::stoi(enginePort) > 0) {
        gameEnginePort = std::stoi(enginePort);
    }
    
    const char* playersCount = std::getenv("PLAYERS_PER_MATCH");
    if (playersCount != nullptr && std::stoi(playersCount) > 0) {
        playersPerMatch = std::stoi(playersCount);
    }
    
}

MatchmakingService::~MatchmakingService() {
    shutdown();
    
#ifdef _WIN32
    WSACleanup();
#endif
}

void MatchmakingService::initialize() {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (isRunning) {
        return;
    }
    
    printf("Matchmaking service initialized\n");
    printf("Game Engine: %s:%d\n", gameEngineIp.c_str(), gameEnginePort);
    printf("Players per match: %d\n", playersPerMatch);
    
    isRunning = true;
}

void MatchmakingService::run(int port) {
    if (!isRunning) {
        printf("Service not initialized\n");
        return;
    }
    
    printf("Starting matchmaking service on port %d\n", port);
    
    
    // Iniciar hilo de verificación de conexiones
    std::thread connectionCheckThread([this]() {
        while (isRunning) {
            std::this_thread::sleep_for(std::chrono::seconds(30));
            if (isRunning) {
                checkPlayerConnections();
            }
        }
    });
    connectionCheckThread.detach();
    
    startSocketServer(port);
}

void MatchmakingService::shutdown() {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (!isRunning) {
        return;
    }
    
    printf("Shutting down matchmaking service\n");
    
    // Cerrar socket del servidor
    if (serverSocket != INVALID_SOCKET) {
        closesocket(serverSocket);
        serverSocket = INVALID_SOCKET;
    }
    
    // Limpiar estructuras de datos
    waitingPlayers.clear();
    activeMatches.clear();
    playerToMatch.clear();
    playerConnections.clear();  // Limpiar conexiones de jugadores
    
    isRunning = false;
}

void MatchmakingService::startSocketServer(int port) {
    // Crear socket del servidor
    serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (serverSocket == INVALID_SOCKET) {
#ifdef _WIN32
        printf("Error creating socket: %d\n", WSAGetLastError());
#else
        printf("Error creating socket: %s\n", strerror(errno));
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
        printf("Bind failed: %d\n", WSAGetLastError());
#else
        printf("Bind failed: %s\n", strerror(errno));
#endif
        closesocket(serverSocket);
        return;
    }
    
    // Empezar a escuchar
    if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR) {
#ifdef _WIN32
        printf("Listen failed: %d\n", WSAGetLastError());
#else
        printf("Listen failed: %s\n", strerror(errno));
#endif
        closesocket(serverSocket);
        return;
    }
    
    printf("Matchmaking server listening on port %d\n", port);
    
    // Loop principal para aceptar conexiones
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
                printf("Accept failed: %d\n", WSAGetLastError());
#else
                printf("Accept failed: %s\n", strerror(errno));
#endif
            }
            continue;
        }
        
        // Manejar cliente en un hilo separado
        std::thread clientThread([this, clientSocket]() {
            handleClientConnection(clientSocket);
        });
        clientThread.detach();
    }
}

void MatchmakingService::handleClientConnection(SOCKET clientSocket) {
    char buffer[4096];
    
    // Obtener IP del cliente
    sockaddr_in clientAddr;
#ifdef _WIN32
    int addrLen = sizeof(clientAddr);
#else
    socklen_t addrLen = sizeof(clientAddr);
#endif
    getpeername(clientSocket, (sockaddr*)&clientAddr, &addrLen);
    char clientIp[INET_ADDRSTRLEN];
    inet_ntop(AF_INET, &clientAddr.sin_addr, clientIp, INET_ADDRSTRLEN);
    
    try {
        // Recibir mensaje del cliente
        int bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
        if (bytesReceived > 0) {
            buffer[bytesReceived] = '\0';
            
            std::string receivedData(buffer);
            json response;
            
            // Solo manejar peticiones HTTP
            if (receivedData.substr(0, 4) == "POST" || receivedData.substr(0, 3) == "GET" || 
                receivedData.substr(0, 7) == "OPTIONS") {
                
                //printf("Received HTTP request from %s\n", clientIp);
                
                // Manejar petición HTTP
                response = handleHttpRequest(receivedData, std::string(clientIp));
                
                // Enviar respuesta HTTP
                sendHttpResponse(clientSocket, response);
            } else {
                // Rechazar peticiones no HTTP
                printf("Rejecting non-HTTP request from %s\n", clientIp);
                json errorResponse = {
                    {"status", "error"},
                    {"message", "This service only accepts HTTP requests"}
                };
                sendHttpResponse(clientSocket, errorResponse);
            }
        }
    } catch (const std::exception& e) {
        printf("Error handling client: %s\n", e.what());
        json errorResponse = {
            {"status", "error"},
            {"message", e.what()}
        };
        sendHttpResponse(clientSocket, errorResponse);
    }
    
    closesocket(clientSocket);
}

json MatchmakingService::processRequest(const json& request, const std::string& clientIp) {
    std::string action = request["action"];
    if (action == "confirmDeck") {
        int playerId = request["playerId"];
        int barajaID=1;
        //int barajaID = request["BarajaId"];  // Tomar el ID de la baraja
        return confirmDeck(playerId, clientIp, barajaID);
    }
    if (action == "joinMatch") {
        int playerId = request["playerId"];
        int barajaId = 1;
        //int barajaId = request["BarajaId"];  // Tomar el ID de la baraja
        return joinMatch(playerId, clientIp,barajaId);
    }
    else if (action == "leaveMatch") {
        int playerId = request["playerId"];
        return leaveMatch(playerId);
    }
    else if (action == "getActiveMatch") {
        int playerId = request["playerId"];
        return getActiveMatch(playerId);
    }
    else if (action == "matchEnded") {
        int matchId = request["matchId"];
        notifyMatchEnded(matchId);
        return json{{"status", "success"}};
    }
    else {
        return json{
            {"status", "error"},
            {"message", "Unknown action: " + action}
        };
    }
}
json MatchmakingService:: confirmDeck(int playerId, const std::string& playerIp, int barajaId) {
    std::lock_guard<std::mutex> lock(mutex);
    
    printf("Player %d requesting to join match from IP %s\n", playerId, playerIp.c_str());
    
    // Verificar si el jugador ya está en una partida activa
    auto playerMatchIt = playerToMatch.find(playerId);
    if (playerMatchIt != playerToMatch.end()) {
        int matchId = playerMatchIt->second;
        auto matchIt = activeMatches.find(matchId);
        if (matchIt != activeMatches.end() && matchIt->second->active) {
            // Reconexión a partida existente
            return json{
                {"status", "reconnect"},
                {"matchId", matchId},
                {"serverIp", matchIt->second->ip},
                {"serverPort", matchIt->second->port}
            };
        }
    }
    
    // NUEVO: Solicitar confirmación de baraja al cliente
    return json{
        {"status", "deck_required"},
        {"message", "Please confirm your deck selection"},
        {"action_required", "confirmDeck"},
        {"playerId", playerId}
    };
}
json MatchmakingService::joinMatch(int playerId, const std::string& playerIp, int barajaId) {
    std::lock_guard<std::mutex> lock(mutex);
    //printf("Deck %d confirmed for player %d, proceeding with matchmaking\n", barajaId, playerId);
    printf("Player %d requesting to join match from IP %s\n", playerId, playerIp.c_str());
    
    // Verificar si el jugador ya está en una partida activa
    auto playerMatchIt = playerToMatch.find(playerId);
    if (playerMatchIt != playerToMatch.end()) {
        int matchId = playerMatchIt->second;
        auto matchIt = activeMatches.find(matchId);
        if (matchIt != activeMatches.end() && matchIt->second->active) {
            // Reconexión a partida existente
            return json{
                {"status", "reconnect"},
                {"matchId", matchId},
                {"serverIp", matchIt->second->ip},
                {"serverPort", matchIt->second->port}
            };
        }
    }
    
    // Verificar si el jugador ya está en la lista de espera
    for (const auto& waitingPlayer : waitingPlayers) {
        if (waitingPlayer.playerId == playerId) {
            printf("Player %d is already in the waiting queue\n", playerId);
            return json{
                {"status", "waiting"},
                {"position", std::distance(waitingPlayers.begin(), 
                    std::find_if(waitingPlayers.begin(), waitingPlayers.end(),
                        [playerId](const WaitingPlayer& wp) { return wp.playerId == playerId; })) + 1},
                {"playersNeeded", playersPerMatch - waitingPlayers.size()},
                {"message", "Already in queue"}
            };
        }
    }
    
    // Agregar jugador a la lista de espera
    waitingPlayers.emplace_back(playerId, playerIp,barajaId);
    
    // Verificar si tenemos suficientes jugadores para crear una partida
    if (waitingPlayers.size() >= static_cast<size_t>(playersPerMatch)) {
        // Tomar los jugadores necesarios
        std::vector<int> playerIds;
        std::vector<std::string> playerIps;
        std::vector<int> barajasIds;
        
        for (int i = 0; i < playersPerMatch; i++) {
            playerIds.push_back(waitingPlayers[i].playerId);
            playerIps.push_back(waitingPlayers[i].ip);
            barajasIds.push_back(waitingPlayers[i].barajaId);  // Tomar el ID de la baraja
        }
        
        // Verificar que no hay jugadores duplicados
        std::set<int> uniquePlayerIds(playerIds.begin(), playerIds.end());
        if (uniquePlayerIds.size() != playerIds.size()) {
            printf("ERROR: Duplicate players detected in match! Players: ");
            for (int pid : playerIds) {
                printf("%d ", pid);
            }
            printf("\n");
            
            // No crear el match, mantener jugadores en espera
            return json{
                {"status", "error"},
                {"message", "Duplicate players detected, staying in queue"}
            };
        }
        
        printf("Creating game server for match %d with players: ", nextMatchId);
        for (int pid : playerIds) {
            printf("%d ", pid);
        }
        printf("\n");
        
        // Remover jugadores de la lista de espera
        waitingPlayers.erase(waitingPlayers.begin(), waitingPlayers.begin() + playersPerMatch);
        
        // Crear servidor de juego
        json gameResult = createGameServer(playerIds, playerIps,barajasIds);
        
        if (gameResult["status"] == "success") {
            int matchId = gameResult["matchId"];
            std::string serverIp = gameResult["serverIp"];
            int serverPort = gameResult["serverPort"];
            
            // Registrar la partida activa
            auto gameServer = std::make_shared<GameServer>(serverIp, serverPort, playerIds,barajasIds);
            activeMatches[matchId] = gameServer;
            
            // Mapear jugadores a la partida
            for (int pid : playerIds) {
                playerToMatch[pid] = matchId;
            }
            
            // Notificar a TODOS los jugadores que fueron emparejados (no solo al solicitante)
            notifyPlayersMatchFound(playerIds, matchId, serverIp, serverPort);
            
            return json{
                {"status", "matched"},
                {"matchId", matchId},
                {"gameServer", {
                    {"ip", serverIp},
                    {"port", serverPort}
                }},
                {"players", playerIds},
                {"message", "Match found! Connect to game server"}
            };
        } else {
            // Error creando el servidor, volver a poner jugadores en espera
            for (int i = 0; i < playersPerMatch; i++) {
                waitingPlayers.emplace_back(playerIds[i], playerIps[i],barajasIds[i]);
            }
            return gameResult;
        }
    }
    
    // Jugador en espera
    return json{
        {"status", "waiting"},
        {"position", waitingPlayers.size()},
        {"playersNeeded", playersPerMatch - waitingPlayers.size()}
    };
}

json MatchmakingService::leaveMatch(int playerId) {
    std::lock_guard<std::mutex> lock(mutex);
    
    printf("Player %d requesting to leave match\n", playerId);
    
    // Remover de la lista de espera
    auto waitingIt = std::find_if(waitingPlayers.begin(), waitingPlayers.end(),
        [playerId](const WaitingPlayer& info) {
            return info.playerId == playerId;
        });
    
    if (waitingIt != waitingPlayers.end()) {
        waitingPlayers.erase(waitingIt);
        printf("Player %d removed from waiting queue\n", playerId);
        return json{
            {"status", "success"},
            {"message", "Removed from waiting queue"}
        };
    }
    
    // Verificar si está en una partida activa
    auto playerMatchIt = playerToMatch.find(playerId);
    if (playerMatchIt != playerToMatch.end()) {
        int matchId = playerMatchIt->second;
        printf("Player %d was in match %d\n", playerId, matchId);
        
        // Remover del mapeo
        playerToMatch.erase(playerId);
        
        // TODO: Notificar al game engine que el jugador se desconectó
        // Por ahora solo removemos del tracking local
        
        return json{
            {"status", "success"},
            {"message", "Left active match"}
        };
    }
    
    return json{
        {"status", "success"},
        {"message", "Player was not in queue or match"}
    };
}

json MatchmakingService::getActiveMatch(int playerId) {
    std::lock_guard<std::mutex> lock(mutex);
    
    auto playerMatchIt = playerToMatch.find(playerId);
    if (playerMatchIt != playerToMatch.end()) {
        int matchId = playerMatchIt->second;
        auto matchIt = activeMatches.find(matchId);
        if (matchIt != activeMatches.end() && matchIt->second->active) {
            printf("Player %d reconnecting to active match %d\n", playerId, matchId);
            return json{
                {"status", "matched"},
                {"matchId", matchId},
                {"gameServer", {
                    {"ip", matchIt->second->ip},
                    {"port", matchIt->second->port}
                }},
                {"players", matchIt->second->playerIds},
                {"message", "Reconnecting to existing match"},
                {"reconnection", true}
            };
            
        } else {
            // Match existe pero no está activo, limpiar
            playerToMatch.erase(playerId);
            printf("Player %d had inactive match %d, cleaned up\n", playerId, matchId);
        }
    }
    
    // Verificar si el jugador está en cola de espera
    for (const auto& waitingPlayer : waitingPlayers) {
        if (waitingPlayer.playerId == playerId) {
            return json{
                {"status", "waiting"},
                {"position", std::distance(waitingPlayers.begin(), std::find_if(waitingPlayers.begin(), waitingPlayers.end(),[playerId](const WaitingPlayer& p) { return p.playerId == playerId; })) + 1},
                {"playersNeeded", playersPerMatch - waitingPlayers.size()},
                {"message", "Still waiting in queue"}
            };
        }
    }
    
    return json{
        {"status", "not_found"},
        {"message", "Player not in any match or queue"}
    };
}

void MatchmakingService::notifyMatchEnded(int matchId) {
    std::lock_guard<std::mutex> lock(mutex);
    
    printf("Match %d ended\n", matchId);
    
    auto matchIt = activeMatches.find(matchId);
    if (matchIt != activeMatches.end()) {
        // Remover jugadores del mapeo
        for (int playerId : matchIt->second->playerIds) {
            playerToMatch.erase(playerId);
        }
        
        // Remover partida activa
        activeMatches.erase(matchId);
    }
}

json MatchmakingService::createGameServer(const std::vector<int>& playerIds, const std::vector<std::string>& playerIps,const std::vector<int>& barajasIds) {
    int matchId = nextMatchId++;
    
    json request = {
        {"action", "createMatch"},
        {"matchId", matchId},
        {"playerIds", playerIds},
        {"playerIps", playerIps},
        {"barajasIds", barajasIds},  // Enviar IDs de las barajas
    };
    
    printf("Creating game server for match %d with players: ", matchId);
    //for (int pid : playerIds) {
    //    printf("%d ", pid);
    //}
    //printf("\n");
    
    json response = sendToGameEngine(request);
    
    // Si se creó exitosamente, registrar en el reconectador
    //if (response.contains("status") && response["status"] == "success") {
    //    GameEngineReconnector::getInstance().addActiveMatch(matchId, playerIds, playerIps);
    //    printf("Match %d registered in GameEngineReconnector\n", matchId);
    //}
    
    return response;
}

json MatchmakingService::sendToGameEngine(const json& message) {
    SOCKET sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (sock == INVALID_SOCKET) {
        return json{
            {"status", "error"},
            {"message", "Failed to create socket"}
        };
    }
    
    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(gameEnginePort);
    inet_pton(AF_INET, gameEngineIp.c_str(), &serverAddr.sin_addr);
    
    if (connect(sock, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        closesocket(sock);
        return json{
            {"status", "error"},
            {"message", "Failed to connect to game engine"}
        };
    }
    
    // Enviar mensaje
    std::string messageStr = message.dump();
    if (send(sock, messageStr.c_str(), messageStr.length(), 0) == SOCKET_ERROR) {
        closesocket(sock);
        return json{
            {"status", "error"},
            {"message", "Failed to send message"}
        };
    }
    
    // Recibir respuesta
    char buffer[4096];
    int bytesReceived = recv(sock, buffer, sizeof(buffer) - 1, 0);
    closesocket(sock);
    
    if (bytesReceived > 0) {
        buffer[bytesReceived] = '\0';
        try {
            return json::parse(buffer);
        } catch (const std::exception& e) {
            return json{
                {"status", "error"},
                {"message", "Invalid response from game engine"}
            };
        }
    }
    
    return json{
        {"status", "error"},
        {"message", "No response from game engine"}
    };
}

json MatchmakingService::handleHttpRequest(const std::string& httpRequest, const std::string& clientIp) {
    // Buscar el cuerpo JSON en la petición HTTP
    size_t bodyStart = httpRequest.find("\r\n\r\n");
    if (bodyStart == std::string::npos) {
        return json{
            {"status", "error"},
            {"message", "Invalid HTTP request - no body found"}
        };
    }
    
    bodyStart += 4; // Saltar "\r\n\r\n"
    std::string jsonBody = httpRequest.substr(bodyStart);
    
    // Si el cuerpo está vacío, intentar extraer parámetros de URL para GET
    if (jsonBody.empty()) {
        // Para peticiones GET o OPTIONS, devolver respuesta por defecto
        return json{
            {"status", "error"},
            {"message", "No JSON body in HTTP request"}
        };
    }
    
    try {
        // Parsear el JSON del cuerpo
        json request = json::parse(jsonBody);
        return processRequest(request, clientIp);
    } catch (const std::exception& e) {
        return json{
            {"status", "error"},
            {"message", "Invalid JSON in HTTP body: " + std::string(e.what())}
        };
    }
}

void MatchmakingService::sendHttpResponse(SOCKET clientSocket, const json& jsonResponse) {
    std::string jsonStr = jsonResponse.dump();
    
    // Crear respuesta HTTP completa
    std::ostringstream response;
    response << "HTTP/1.1 200 OK\r\n";
    response << "Content-Type: application/json\r\n";
    response << "Content-Length: " << jsonStr.length() << "\r\n";
    response << "Access-Control-Allow-Origin: *\r\n";  // Para CORS
    response << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
    response << "Access-Control-Allow-Headers: Content-Type\r\n";
    response << "Connection: close\r\n";
    response << "\r\n";
    response << jsonStr;
    
    std::string responseStr = response.str();
    send(clientSocket, responseStr.c_str(), responseStr.length(), 0);
}

void MatchmakingService::notifyPlayersMatchFound(const std::vector<int>& playerIds, int matchId, 
                                                const std::string& serverIp, int serverPort) {
    printf("Notifying players about match %d: ", matchId);
    for (int playerId : playerIds) {
        printf("%d ", playerId);
    }
    printf("\n");
    
    json matchNotification = {
        {"status", "matched"},
        {"matchId", matchId},
        {"gameServer", {
            {"ip", serverIp},
            {"port", serverPort}
        }},
        {"players", playerIds},
        {"message", "Match found! Connect to game server"},
        {"type", "matchNotification"}
    };
    
    // TODO: Implementar un sistema de notificaciones push cuando tengamos WebSockets persistentes
    // Por ahora, los jugadores deberán hacer polling para verificar su estado
    
    // Almacenar la notificación para que los jugadores la puedan recuperar
    for (int playerId : playerIds) {
        printf("Player %d has been assigned to match %d\n", playerId, matchId);
    }
}

bool MatchmakingService::sendMessageToPlayer(int playerId, const json& message) {
    std::lock_guard<std::mutex> lock(mutex);
    
    auto connIt = playerConnections.find(playerId);
    if (connIt != playerConnections.end() && connIt->second->isConnected) {
        try {
            std::string messageStr = message.dump();
            std::ostringstream response;
            response << "HTTP/1.1 200 OK\r\n";
            response << "Content-Type: application/json\r\n";
            response << "Content-Length: " << messageStr.length() << "\r\n";
            response << "Connection: close\r\n";
            response << "\r\n";
            response << messageStr;
            
            std::string responseStr = response.str();
            int result = send(connIt->second->socket, responseStr.c_str(), responseStr.length(), 0);
            
            if (result == SOCKET_ERROR) {
                printf("Failed to send message to player %d\n", playerId);
                connIt->second->isConnected = false;
                return false;
            }
            
            printf("Message sent to player %d\n", playerId);
            return true;
        } catch (const std::exception& e) {
            printf("Error sending message to player %d: %s\n", playerId, e.what());
            connIt->second->isConnected = false;
            return false;
        }
    }
    
    printf("Player %d is not connected\n", playerId);
    return false;
}

void MatchmakingService::checkPlayerConnections() {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Limpiar conexiones viejas y verificar reconexiones necesarias
    auto connIt = playerConnections.begin();
    bool connectionsChanged = false;
    
    while (connIt != playerConnections.end()) {
        auto& connection = connIt->second;
        auto timeSinceLastSeen = std::chrono::steady_clock::now() - connection->lastSeen;
        
        if (timeSinceLastSeen > std::chrono::seconds(60)) {
            // Conexión expirada, verificar si el jugador necesita reconexión a su match
            int playerId = connection->playerId;
            auto playerMatchIt = playerToMatch.find(playerId);
            
            if (playerMatchIt != playerToMatch.end()) {
                int matchId = playerMatchIt->second;
                printf("Player %d disconnected but has active match %d - ready for reconnection\n", playerId, matchId);
            }
            
            
            // Remover conexión expirada
            connIt = playerConnections.erase(connIt);
            connectionsChanged = true;
        } else {
            ++connIt;
        }
    }
    

}
