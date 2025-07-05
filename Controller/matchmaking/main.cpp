#include <iostream>
#include <thread>
#include <cstdlib>
#include "libs/matchmaking_service.hpp"
#include "src/load_env_file.cpp"

using namespace std;

int main() {
    loadEnvFile();
    printf("Starting Matchmaking Service\n");
    
    // Inicializar el servicio de matchmaking
    MatchmakingService::getInstance().initialize();
    
    // Obtener el puerto desde la variable de entorno
    int servicePort = 9001; // Puerto por defecto para matchmaking
    const char* portEnv = std::getenv("MATCHMAKING_PORT");
    if (portEnv != nullptr && std::stoi(portEnv) > 0) {
        servicePort = std::stoi(portEnv);
    }
    
    // Iniciar el servicio en un hilo separado
    std::thread serviceThread([servicePort]() {
        MatchmakingService::getInstance().run(servicePort);
    });
    
    // Esperar a que el usuario presione una tecla para finalizar
    printf("Press Enter to stop the matchmaking service...\n");
    cin.get();
    
    // Limpiar
    MatchmakingService::getInstance().shutdown();
    
    // Esperar a que el hilo termine
    if (serviceThread.joinable()) {
        serviceThread.join();
    }
    
    printf("Matchmaking service stopped\n");
    return 0;
}
