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
#include <cstdlib> // Para getenv

// Forward declarations
class Match;
class GameThread;

// Orchestrator class - manages player connections and match assignments
class Orchestrator {
public:
    // Singleton pattern
    static Orchestrator& getInstance() {
        static Orchestrator instance;
        return instance;
    }

    // Connect a player to the system
    int connectPlayer(int playerId);
    
    // Disconnect a player from the system
    void disconnectPlayer(int playerId);
    
    // Initialize the orchestrator
    void initialize();
    
    // Shutdown the orchestrator
    void shutdown();

    // Match ended notification
    void notifyMatchEnded(int matchId);
    
    // Get a match by ID
    std::shared_ptr<Match> getMatchById(int matchId);

    // Create a match with specific ID (for matchmaking service)
    bool createMatchWithId(int matchId, int player1Id, int player2Id);

private:
    // Constructor is private for singleton
    Orchestrator();
    ~Orchestrator();

    // Disallow copying
    Orchestrator(const Orchestrator&) = delete;
    Orchestrator& operator=(const Orchestrator&) = delete;

    // Config values (loaded from environment variables)
    int maxMatchesPerThread;
    
    // Create a new match between two players
    int createMatch(int player1Id, int player2Id);
    
    // Find an available thread or create a new one
    int findAvailableThread();

    // Data structures
    std::vector<int> waitingPlayers;
    std::unordered_map<int, std::shared_ptr<Match>> matches;  // matchId -> Match
    std::unordered_map<int, std::shared_ptr<GameThread>> threads;  // threadId -> GameThread
    
    // Thread safety
    std::mutex mutex;
    
    // Id generators
    int nextMatchId = 1;
    int nextThreadId = 1;

    // Status
    bool isRunning = false;
};