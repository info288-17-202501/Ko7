#include "../libs/game_thread.hpp"
#include "../libs/orchestrator.hpp"

GameThread::GameThread(int threadId) : threadId(threadId), running(true) {
    // Variable de entorno MAX_THREADS comentada por ahora
    // const char* envValue = std::getenv("MAX_THREADS");
    //int maxThreads = 5; // Valor por defecto
    //if (envValue != nullptr && std::stoi(envValue) > 0) {
    //    maxThreads = std::stoi(envValue);
        //printf("MAX_MATCHES_PER_THREAD=%d\n", maxMatchesPerThread);
    //}
    printf("Creating thread %d\n", threadId);
    // Inicia el worker thread
    worker = std::thread(&GameThread::threadLoop, this);
}

GameThread::~GameThread() {
    stop();
    // Espera a que el thread termine si es que se puede juntar
    if (worker.joinable()) {
        worker.join();
    }
}

void GameThread::addMatch(int matchId, int player1Id, int player2Id) {
    std::lock_guard<std::mutex> lock(mutex);
    // Añade una acción para crear un nuevo match
    pendingActions.push_back({
        Action::ADD_MATCH, matchId, player1Id, player2Id, 0
    });
    
    // Notifica al thread
    cv.notify_one();
}

void GameThread::handlePlayerDisconnect(int matchId, int playerId) {
    std::lock_guard<std::mutex> lock(mutex);    
    // Añade una acción para la desconexión del jugador
    pendingActions.push_back({
        Action::DISCONNECT_PLAYER, matchId, 0, 0, playerId
    });
    // Notifica al thread
    cv.notify_one();
}

void GameThread::handlePlayerReconnect(int matchId, int playerId) {
    std::lock_guard<std::mutex> lock(mutex);    
    // Añade una acción para la reconexión del jugador
    pendingActions.push_back({
        Action::RECONNECT_PLAYER, matchId, 0, 0, playerId
    });
    // Notifica al thread
    cv.notify_one();
}

int GameThread::getActiveMatchCount() const {
    return matches.size();
}

void GameThread::stop() {
    running = false;
    cv.notify_all();
}

void GameThread::threadLoop() {
    while (running) {
        std::vector<Action> actions; 
        // acciones pendientes
        {
            std::unique_lock<std::mutex> lock(mutex);
            // Espera por acciones o stop
            cv.wait(lock, [this] { 
                return !pendingActions.empty() || !running; 
            });
            if (!running && pendingActions.empty()) {
                break;
            }
            // Mueve las acciones pendientes a copia local
            actions = std::move(pendingActions);
            pendingActions.clear();
        }
        
        // Procesa acciones
        for (const auto& action : actions) {
            switch (action.type) {
                case Action::ADD_MATCH: {
                    // Crea nuevo match
                    auto match = std::make_shared<Match>(
                        action.matchId, action.player1Id, action.player2Id);       
                    // Añade el match al mapa
                    matches[action.matchId] = match;
                    break;
                }
                
                case Action::DISCONNECT_PLAYER: {
                    // Find the match
                    // Encuentra el match
                    auto it = matches.find(action.matchId);
                    if (it != matches.end()) {
                        // Handle the disconnect
                        // Maneja desconexion
                        bool matchEnded = it->second->handleDisconnect(action.playerId);
                        // Si el match terminó, lo elimina y notifica al orquestador
                        if (matchEnded) {
                            matches.erase(it);
                            Orchestrator::getInstance().notifyMatchEnded(action.matchId);
                        }
                    }
                    break;
                }
                
                case Action::RECONNECT_PLAYER: {
                    // Encuentra el match
                    auto it = matches.find(action.matchId);
                    if (it != matches.end()) {
                        // Maneja la reconexión
                        bool reconnected = it->second->reconnectPlayer(action.playerId);
                        if (reconnected) {
                            printf("Player %d successfully reconnected to match %d in thread %d\n", action.playerId, action.matchId, threadId);
                        }}
                    break;
                }
            }
        }
    }
    printf("Thread %d stopped\n", threadId);
}
