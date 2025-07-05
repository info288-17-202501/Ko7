#include <iostream>
#include <thread>
#include "libs/orchestrator.hpp"
//#include "libs/websocket_manager.hpp"
#include "libs/matchmaking_handler.hpp"
#include "src/load_env_file.cpp"
using namespace std;

int main() {
    loadEnvFile();
    printf("Starting game orchestrator with WebSocket support\n");
    
    // Inicializar el orquestador
    Orchestrator::getInstance().initialize();
    
    // Inicializar el manejador de matchmaking
    MatchmakingHandler::getInstance().initialize();
    
    // Inicializar el servidor WebSocket
    //WebSocketManager::getInstance().initialize();
    // Obtener el puerto desde la variable de entorno
    int serverPort = 9002; // Valor por defecto
    const char* portEnv = std::getenv("SERVER_PORT");
    if (portEnv != nullptr && std::stoi(portEnv) > 0) {
        serverPort = std::stoi(portEnv);
    }
    
    
    // Iniciar el manejador de matchmaking en un hilo separado
    std::thread mmThread([serverPort]() {
        MatchmakingHandler::getInstance().run(serverPort);  // Puerto 9001 para matchmaking);
    });
    
    // Iniciar el servidor WebSocket en un hilo separado
    //std::thread wsThread([serverPort]() {
    //    WebSocketManager::getInstance().run(serverPort);  // Puerto 9002 para WebSocket
    //});
    
    // Esperar a que el usuario presione una tecla para finalizar
    printf("Press Enter to stop the server...\n");
    cin.get();
    
    // Limpiar
    Orchestrator::getInstance().shutdown();
    MatchmakingHandler::getInstance().shutdown();
    //WebSocketManager::getInstance().stop();
    
    // Esperar a que los hilos terminen
    if (mmThread.joinable()) {
        mmThread.join();
    }
    
    // Esperar a que el hilo de WebSocket termine
    //if (wsThread.joinable()) {
    //    wsThread.join();
    //}
    
    printf("Server stopped\n");
    return 0;
}
