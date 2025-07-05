#include "../libs/game_websocket_server.hpp"
#include "../libs/orchestrator.hpp"
#include "../libs/match.hpp"
#include <iostream>
#include <functional>

GameWebSocketServer::GameWebSocketServer(int matchId, const std::vector<std::string>& allowedIps)
    : matchId(matchId), allowedIps(allowedIps), running(false) {
    printf("Game WebSocket server created for match %d\n", matchId);
}

GameWebSocketServer::~GameWebSocketServer() {
    stop();
}

void GameWebSocketServer::initialize() {
    // Configurar el servidor WebSocket
    server.init_asio();
    
    // Registrar callbacks
    server.set_open_handler(std::bind(&GameWebSocketServer::onOpen, this, std::placeholders::_1));
    server.set_close_handler(std::bind(&GameWebSocketServer::onClose, this, std::placeholders::_1));
    server.set_message_handler(std::bind(
        &GameWebSocketServer::onMessage, this,
        std::placeholders::_1, std::placeholders::_2
    ));

    // Desactivar logs para producción
    server.clear_access_channels(websocketpp::log::alevel::all);
    server.set_reuse_addr(true);
    
    printf("Game WebSocket server initialized for match %d\n", matchId);
}

void GameWebSocketServer::run(uint16_t port) {
    if (running) return;
    
    try {
        // Configurar el puerto de escucha
        server.listen(port);
        // Iniciar el servidor
        server.start_accept();
        printf("Game WebSocket server started for match %d on port %d\n", matchId, port);
        running = true;
        // Iniciar el bucle de eventos
        server.run();
    } catch (const std::exception& e) {
        printf("Game WebSocket server error for match %d: %s\n", matchId, e.what());
    }
}

void GameWebSocketServer::stop() {
    if (!running) return;
    
    try {
        // Detener el servidor
        server.stop();
        running = false;
        printf("Game WebSocket server stopped for match %d\n", matchId);
    } catch (const std::exception& e) {
        printf("Error stopping game WebSocket server for match %d: %s\n", matchId, e.what());
    }
}

void GameWebSocketServer::onOpen(connection_hdl hdl) {
    // Verificar IP si hay restricciones
    if (!allowedIps.empty()) {
        auto con = server.get_con_from_hdl(hdl);
        std::string clientEndpoint;
        std::string clientIp;
        
        try {
            clientEndpoint = con->get_remote_endpoint();
            //printf("DEBUG: Raw endpoint for match %d: [%s]\n", matchId, clientEndpoint.c_str());
            
            // Extraer solo la IP (remover puerto)
            size_t colonPos = clientEndpoint.find_last_of(':');
            if (colonPos != std::string::npos) {
                clientIp = clientEndpoint.substr(0, colonPos);
            } else {
                clientIp = clientEndpoint;
            }
            
            // Limpiar corchetes si es IPv6
            if (!clientIp.empty() && clientIp[0] == '[') {
                size_t closeBracket = clientIp.find(']');
                if (closeBracket != std::string::npos) {
                    clientIp = clientIp.substr(1, closeBracket - 1);
                }
            }
            
            //printf("DEBUG: Extracted IP for match %d: [%s]\n", matchId, clientIp.c_str());
            //printf("DEBUG: Allowed IPs for match %d: ", matchId);
            //for (const auto& ip : allowedIps) {
            //    printf("[%s] ", ip.c_str());
           // }
            //printf("\n");
            
        } catch (const std::exception& e) {
            printf("Error extracting client IP for match %d: %s\n", matchId, e.what());
            clientIp = "unknown";
        }
        
        if (!isIpAllowed(clientIp)) {
            printf("Connection from unauthorized IP: [%s] for match %d\n", clientIp.c_str(), matchId);
            server.close(hdl, websocketpp::close::status::policy_violation, "Unauthorized IP");
            return;
        } else {
            //printf("Connection from authorized IP: [%s] for match %d\n", clientIp.c_str(), matchId);
        }
    }
    
    printf("WebSocket connection opened for match %d\n", matchId);
}

void GameWebSocketServer::onClose(connection_hdl hdl) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Buscar el playerId asociado a esta conexión
    auto it = connectionPlayers.find(hdl);
    if (it != connectionPlayers.end()) {
        int playerId = it->second;
        // Informar al orquestador que el jugador se desconectó
        Orchestrator::getInstance().disconnectPlayer(playerId);
        // Eliminar la conexión de los mapas
        playerConnections.erase(playerId);
        connectionPlayers.erase(hdl);
        printf("Player %d disconnected from match %d\n", playerId, matchId);
    }
}

void GameWebSocketServer::onMessage(connection_hdl hdl, WebSocketServer::message_ptr msg) {
    try {
        // Parsear el mensaje JSON
        json data = json::parse(msg->get_payload());
        std::string type = data["type"];
        
        if (type == "identify" || type == "connect") {
            int playerId = data["playerId"];
            {
                // Registrar la asociación entre playerId y connection_hdl
                std::lock_guard<std::mutex> lock(mutex);
                playerConnections[playerId] = hdl;
                connectionPlayers[hdl] = playerId;
            }
            
            printf("Player %d identified/connected to match %d\n", playerId, matchId);
            
            // Verificar que el jugador pertenece a esta partida
            auto match = Orchestrator::getInstance().getMatchById(matchId);
            if (match) {
                auto playerIds = match->getPlayerIds();
                if (playerIds.first == playerId || playerIds.second == playerId) {
                    // Jugador válido para esta partida
                    int opponentId = (playerIds.first == playerId) ? playerIds.second : playerIds.first;
                    
                    json response = {
                        {"type", "matchJoined"},
                        {"matchId", matchId},
                        {"opponentId", opponentId}
                    };
                    server.send(hdl, response.dump(), websocketpp::frame::opcode::text);
                    
                    // Notificar al oponente si está conectado
                    json opponentNotification = {
                        {"type", "opponentConnected"},
                        {"matchId", matchId},
                        {"opponentId", playerId}
                    };
                    sendMessage(opponentId, opponentNotification);
                } else {
                    // Jugador no autorizado para esta partida
                    json response = {
                        {"type", "error"},
                        {"message", "Unauthorized player for this match"}
                    };
                    server.send(hdl, response.dump(), websocketpp::frame::opcode::text);
                    server.close(hdl, websocketpp::close::status::policy_violation, "Unauthorized player");
                }
            } else {
                // Partida no encontrada
                json response = {
                    {"type", "error"},
                    {"message", "Match not found"}
                };
                server.send(hdl, response.dump(), websocketpp::frame::opcode::text);
            }
        }
         else if (type == "playerMessage") {
            // Obtener el playerId de la conexión
            std::lock_guard<std::mutex> lock(mutex);
            auto it = connectionPlayers.find(hdl);
            if (it == connectionPlayers.end()) {
                printf("Message from unidentified player for match %d\n", matchId);
                return;
            }
            
            int playerId = it->second;
            std::string content = data["content"];
            
            printf("Player %d sent message in match %d: %s\n", playerId, matchId, content.c_str());
            
            // Reenviar el mensaje a todos los otros jugadores en la partida
            json messageNotification = {
                {"type", "playerMessage"},
                {"fromPlayerId", playerId},
                {"matchId", matchId},
                {"content", content}
            };
            std::string messageStr = messageNotification.dump();
            
            // Enviar a todos los jugadores conectados excepto al remitente
            for (const auto& pair : playerConnections) {
                if (pair.first != playerId) {
                    try {
                        server.send(pair.second, messageStr, websocketpp::frame::opcode::text);
                        printf("Message forwarded to player %d\n", pair.first);
                    } catch (const std::exception& e) {
                        printf("Error sending message to player %d: %s\n", pair.first, e.what());
                    }
                }
            }
        }
        else if (type == "action") {
            int playerId = connectionPlayers[hdl];
            std::string action = data["action"];
            std::string message = "";
            if (data.contains("message")) {
                message = data["message"];
            }
            
            printf("Player %d performed action: %s in match %d\n", playerId, action.c_str(), matchId);
            
            // Reenviar la acción al otro jugador en la partida
            auto match = Orchestrator::getInstance().getMatchById(matchId);
            if (match) {
                auto playerIds = match->getPlayerIds();
                int opponentId = (playerIds.first == playerId) ? playerIds.second : playerIds.first;
                
                // Crear mensaje para el oponente
                json actionNotification = {
                    {"type", "opponentAction"},
                    {"matchId", matchId},
                    {"action", action},
                    {"fromPlayerId", playerId},
                    {"message", message}
                };
                
                // Enviar notificación al oponente
                sendMessage(opponentId, actionNotification);
            }
        }
        else {
            printf("Unknown message type: %s for match %d\n", type.c_str(), matchId);
        }
    } catch (const std::exception& e) {
        printf("Error processing message for match %d: %s\n", matchId, e.what());
    }
}

void GameWebSocketServer::sendMessage(int playerId, const json& message) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Buscar la conexión del jugador
    auto it = playerConnections.find(playerId);
    if (it != playerConnections.end()) {
        try {
            // Enviar el mensaje
            server.send(it->second, message.dump(), websocketpp::frame::opcode::text);
        } catch (const std::exception& e) {
            printf("Error sending message to player %d in match %d: %s\n", playerId, matchId, e.what());
        }
    }
}

bool GameWebSocketServer::isIpAllowed(const std::string& ip) {
    if (allowedIps.empty()) {
        //printf("DEBUG: No IP restrictions for match %d\n", matchId);
        return true;  // Sin restricciones
    }
    
    //printf("DEBUG: Checking IP [%s] against allowed IPs for match %d\n", ip.c_str(), matchId);
    
    // Normalizar la IP del cliente
    std::string normalizedClientIp = ip;
    
    // Manejar IPv6 mapped IPv4 addresses (::ffff:127.0.0.1 -> 127.0.0.1)
    if (normalizedClientIp.find("::ffff:") == 0) {
        normalizedClientIp = normalizedClientIp.substr(7); // Remover "::ffff:"
        //printf("DEBUG: Normalized IPv6 mapped address to [%s]\n", normalizedClientIp.c_str());
    }
    
    // Verificar si la IP está en la lista de permitidas
    for (const auto& allowedIp : allowedIps) {
        //printf("DEBUG: Comparing [%s] with [%s]\n", normalizedClientIp.c_str(), allowedIp.c_str());
        
        // Comparación exacta con IP normalizada
        if (normalizedClientIp == allowedIp) {
            //printf("DEBUG: Exact match found for IP [%s]\n", normalizedClientIp.c_str());
            return true;
        }
        
        // Manejar casos especiales de localhost
        if ((allowedIp == "127.0.0.1" || allowedIp == "localhost") && 
            (normalizedClientIp == "127.0.0.1" || normalizedClientIp == "::1" || normalizedClientIp == "localhost")) {
            //printf("DEBUG: Localhost match found for IP [%s]\n", normalizedClientIp.c_str());
            return true;
        }
        
        // Si allowedIp es localhost/127.0.0.1 y ip está vacío o es unknown, permitir
        if ((allowedIp == "127.0.0.1" || allowedIp == "localhost") && 
            (normalizedClientIp.empty() || normalizedClientIp == "unknown")) {
            //printf("DEBUG: Local connection assumed for IP [%s]\n", normalizedClientIp.c_str());
            return true;
        }
    }
    
    //printf("DEBUG: No match found for IP [%s]\n", normalizedClientIp.c_str());
    return false;
}
