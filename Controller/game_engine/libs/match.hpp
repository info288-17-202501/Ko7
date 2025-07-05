#pragma once

#include <iostream>
#include <mutex>
#include <utility>
#include <atomic>

enum class ConnectionStatus {
    CONNECTED,
    DISCONNECTED
};

// Represents a single match between two players
class Match {
public:
    Match(int matchId, int player1Id, int player2Id);
    
    // Handle player disconnection
    bool handleDisconnect(int playerId);
    
    // Handle player reconnection
    bool reconnectPlayer(int playerId);
    
    // Handle player action
    void handleAction(int playerId, const std::string& action);
    
    // Check if match is active
    bool isActive() const;
    
    // Get match ID
    int getMatchId() const;
    
    // Get player IDs
    std::pair<int, int> getPlayerIds() const;

private:
    int matchId;
    int player1Id;
    int player2Id;
    std::atomic<ConnectionStatus> player1Status;
    std::atomic<ConnectionStatus> player2Status;
    std::atomic<bool> active;
    std::mutex mutex;
};
