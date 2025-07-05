#pragma once

#include <iostream>
#include <memory>
#include <thread>
#include <mutex>
#include <atomic>
#include <vector>
#include <unordered_map>
#include <condition_variable>
#include "match.hpp"

class GameThread {
public:
    GameThread(int threadId);
    ~GameThread();

    // Add a match to this thread
    void addMatch(int matchId, int player1Id, int player2Id);
    
    // Handle player disconnection
    void handlePlayerDisconnect(int matchId, int playerId);
    
    // Handle player reconnection
    void handlePlayerReconnect(int matchId, int playerId);
    
    // Get number of active matches
    int getActiveMatchCount() const;
    
    // Stop the thread
    void stop();

private:
    // Thread function
    void threadLoop();

    int threadId;
    std::thread worker;
    std::mutex mutex;
    std::condition_variable cv;
    
    // Map of matchId -> Match
    std::unordered_map<int, std::shared_ptr<Match>> matches;
    
    // Queue of pending actions
    struct Action {
        enum Type { ADD_MATCH, DISCONNECT_PLAYER, RECONNECT_PLAYER } type;
        int matchId;
        int player1Id;
        int player2Id;
        int playerId;  // For disconnect/reconnect actions
    };
    std::vector<Action> pendingActions;
    
    // Thread state
    std::atomic<bool> running;
};
