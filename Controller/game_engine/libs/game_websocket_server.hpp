#pragma once

#include <websocketpp/server.hpp>
#include <websocketpp/config/asio_no_tls.hpp>
#include <nlohmann/json.hpp>
#include <string>
#include <unordered_map>
#include <mutex>
#include <functional>
#include <vector>
#include <memory>

using json = nlohmann::json;
using websocketpp::connection_hdl;

// Definir hash personalizado para connection_hdl
struct GameConnectionHasher {
    std::size_t operator()(connection_hdl const& hdl) const {
        return std::hash<void*>()(hdl.lock().get());
    }
};

// Definir comparador personalizado para connection_hdl
struct GameConnectionEqual {
    bool operator()(connection_hdl const& lhs, connection_hdl const& rhs) const {
        return lhs.lock().get() == rhs.lock().get();
    }
};

// Servidor WebSocket específico para una partida
class GameWebSocketServer {
public:
    GameWebSocketServer(int matchId, const std::vector<std::string>& allowedIps);
    ~GameWebSocketServer();

    // Inicializar el servidor
    void initialize();
    
    // Iniciar el servidor en un puerto específico
    void run(uint16_t port);
    
    // Detener el servidor
    void stop();
    
    // Enviar mensaje a un cliente específico
    void sendMessage(int playerId, const json& message);

private:
    // Callbacks para eventos WebSocket
    void onOpen(connection_hdl hdl);
    void onClose(connection_hdl hdl);
    void onMessage(connection_hdl hdl, websocketpp::server<websocketpp::config::asio>::message_ptr msg);

    // Verificar si una IP está permitida
    bool isIpAllowed(const std::string& ip);

    // Tipo de servidor WebSocket
    typedef websocketpp::server<websocketpp::config::asio> WebSocketServer;
    
    // Servidor WebSocket
    WebSocketServer server;
    
    // ID de la partida
    int matchId;
    
    // IPs permitidas para conexión
    std::vector<std::string> allowedIps;
    
    // Mapeo de playerId a connection_handle
    std::unordered_map<int, connection_hdl> playerConnections;
    
    // Mapeo de connection_handle a playerId
    std::unordered_map<connection_hdl, int, GameConnectionHasher, GameConnectionEqual> connectionPlayers;
    
    // Mutex para proteger los mapas
    std::mutex mutex;
    
    // Estado del servidor
    bool running;
};
