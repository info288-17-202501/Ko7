#include "../libs/orchestrator.hpp"
#include "../libs/game_thread.hpp"
#include "../libs/match.hpp"
#include <cstdlib> // Para getenv

Orchestrator::Orchestrator() : maxMatchesPerThread(5), isRunning(false) {
    printf("Orchestrator created\n");
    const char* envValue = std::getenv("MAX_MATCHES_PER_THREAD");
    if (envValue != nullptr && std::stoi(envValue) > 0) {
        maxMatchesPerThread = std::stoi(envValue);
        //printf("MAX_MATCHES_PER_THREAD=%d\n", maxMatchesPerThread);
    }
}
Orchestrator::~Orchestrator() {
    shutdown();
}

void Orchestrator::initialize() {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (isRunning) {
        return;
    }
    
    printf("Initializing orchestrator\n");
    isRunning = true;
}

void Orchestrator::shutdown() {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (!isRunning) {
        return;
    }
    
    printf("Shutting down orchestrator\n");
    // Detiene threads
    for (auto& pair : threads) {
        pair.second->stop();
    }
    // borrar todas las estructuras de datos
    waitingPlayers.clear();
    matches.clear();
    threads.clear();
    
    isRunning = false;
}

int Orchestrator::connectPlayer(int playerId) {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (!isRunning) {
        printf("Orchestrator not running, can't connect player\n");
        return -1;
    }
    
    printf("Player %d connected\n", playerId);
    
    // Primero comprobar si el jugador estaba en una partida existente
    for (auto& pair : matches) {
        auto matchId = pair.first;
        auto match = pair.second;
        auto players = match->getPlayerIds();
        
        if ((players.first == playerId || players.second == playerId) && match->isActive()) {
            // Buscar el thread que maneja este match
            for (auto& threadPair : threads) {
                if (threadPair.second->getActiveMatchCount() > 0) {
                    threadPair.second->handlePlayerReconnect(matchId, playerId);
                    //printf("Player %d reconnecting to existing match %d in thread %d\n", playerId, matchId, threadPair.first);
                    return matchId;  // Devolver el ID de la partida existente
                }
            }
        }
    }
    
    // Si llegamos aquí, el jugador no estaba en una partida existente o no se pudo reconectar
    
    // mira si hay jugadores en espera
    if (waitingPlayers.empty()) {
        // No hay jugadores en espera, añadir este jugador a la lista de espera
        waitingPlayers.push_back(playerId);
        return 0;  
    } else {
        // Tomar el jugador en espera
        int waitingPlayerId = waitingPlayers.back();
        waitingPlayers.pop_back();
        
        // Crear partida entre el jugador conectado y el jugador en espera
        int matchId = createMatch(playerId, waitingPlayerId);
        return matchId;  
    }
}

void Orchestrator::disconnectPlayer(int playerId) {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (!isRunning) {
        return;
    }
    
    printf("Player %d disconnected\n", playerId);
    // ver si el jugador está en la lista de espera
    auto it = std::find(waitingPlayers.begin(), waitingPlayers.end(), playerId);
    if (it != waitingPlayers.end()) {
        waitingPlayers.erase(it);
        return;
    }
    
    // ver si el jugador está en un match activo
    for (auto& pair : matches) {
        auto matchId = pair.first;
        auto match = pair.second;
        auto players = match->getPlayerIds();
        
        if (players.first == playerId || players.second == playerId) {
            // Buscar el thread que maneja este match
            for (auto& threadPair : threads) {
                threadPair.second->handlePlayerDisconnect(matchId, playerId);
            }
        }
    }
}

int Orchestrator::createMatch(int player1Id, int player2Id) {
    // Nuevo ID para la partida
    int matchId = nextMatchId++;
    int threadId = findAvailableThread();
    
    // Crear match
    auto match = std::make_shared<Match>(matchId, player1Id, player2Id);
    matches[matchId] = match;
    threads[threadId]->addMatch(matchId, player1Id, player2Id);
    
    //printf("Created match %d for players %d and %d in thread %d\n", matchId, player1Id, player2Id, threadId);
    return matchId;
}

int Orchestrator::findAvailableThread() {
    // Look for a thread with less than MAX_MATCHES_PER_THREAD matches
    // buscar un thread que le alcance la partida
    for (auto& pair : threads) {
         if (pair.second->getActiveMatchCount() < maxMatchesPerThread) {
            return pair.first;
        } 
    }
    
    // Crear nuevo thread si no hay disponible
    int threadId = nextThreadId++;
    threads[threadId] = std::make_shared<GameThread>(threadId);
    return threadId;
}

void Orchestrator::notifyMatchEnded(int matchId) {
    std::lock_guard<std::mutex> lock(mutex);
    
    // Remover match del mapa
    matches.erase(matchId);
}

std::shared_ptr<Match> Orchestrator::getMatchById(int matchId) {
    std::lock_guard<std::mutex> lock(mutex);
    
    auto it = matches.find(matchId);
    if (it != matches.end()) {
        return it->second;
    }
    
    return nullptr;
}

bool Orchestrator::createMatchWithId(int matchId, int player1Id, int player2Id) {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (!isRunning) {
        return false;
    }
    
    // Verificar que el matchId no exista ya
    if (matches.find(matchId) != matches.end()) {
        printf("Match %d already exists\n", matchId);
        return false;
    }
    
    int threadId = findAvailableThread();
    
    // Crear match con ID específico
    auto match = std::make_shared<Match>(matchId, player1Id, player2Id);
    matches[matchId] = match;
    threads[threadId]->addMatch(matchId, player1Id, player2Id);
    
    // Actualizar nextMatchId si es necesario
    if (matchId >= nextMatchId) {
        nextMatchId = matchId + 1;
    }
    
    printf("Created match %d for players %d and %d in thread %d\n", matchId, player1Id, player2Id, threadId);
    return true;
}
