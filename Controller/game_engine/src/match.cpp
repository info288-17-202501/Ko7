#include "../libs/match.hpp"
#include <iostream>

Match::Match(int matchId, int player1Id, int player2Id)
    : matchId(matchId), player1Id(player1Id), player2Id(player2Id),
      player1Status(ConnectionStatus::CONNECTED),
      player2Status(ConnectionStatus::CONNECTED),
      active(true) {
        printf("Match %d started between players %d and %d\n", matchId, player1Id, player2Id);
    // sE PUEDE INICIAR EL JUEGO AQUI (SE CONECTARON LOS JUGADORES)
}

bool Match::handleDisconnect(int playerId) {
    if (playerId == player1Id) {
        player1Status = ConnectionStatus::DISCONNECTED;
        printf("Player %d disconnected from match %d\n", playerId, matchId);
    } else if (playerId == player2Id) {
        player2Status = ConnectionStatus::DISCONNECTED;
        printf("Player %d disconnected from match %d\n", playerId, matchId);
    } else {
        // El jugador no está en este match
        return false;
    }
    
    //
    // mira si ambos jugadores están desconectados
    //if (player1Status == ConnectionStatus::DISCONNECTED && player2Status == ConnectionStatus::DISCONNECTED) {
    //    printf("Match %d ended: both players disconnected\n", matchId);
    //    active = false;
    //    return true;  
    //}
    return false;  
}

void Match::handleAction(int playerId, const std::string& action) {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (!active) {
        printf("Ignoring action from player %d as match %d is no longer active\n", playerId, matchId);
        return;
    }
    
    // Verifica si el jugador es parte de este match
    if (playerId != player1Id && playerId != player2Id) {
        printf("Player %d is not part of match %d\n", playerId, matchId);
        return;
    }
    
    // Mira si el jugador está conectado
    if ((playerId == player1Id && player1Status == ConnectionStatus::DISCONNECTED) ||
        (playerId == player2Id && player2Status == ConnectionStatus::DISCONNECTED)) {
        printf("Ignoring action from disconnected player %d\n", playerId);
        return;
    }
    // Porcesar la accion 
    printf("Player %d performed action '%s' in match %d\n", playerId, action.c_str(), matchId);
    // poner verdadera logica de juego aqui**
}

bool Match::isActive() const {
    return active;
}

int Match::getMatchId() const {
    return matchId;
}

std::pair<int, int> Match::getPlayerIds() const {
    return std::make_pair(player1Id, player2Id);
}

// Método para reconectar a un jugador
bool Match::reconnectPlayer(int playerId) {
    std::lock_guard<std::mutex> lock(mutex);
    
    if (playerId == player1Id && player1Status == ConnectionStatus::DISCONNECTED) {
        player1Status = ConnectionStatus::CONNECTED;
        printf("Player %d reconnected to match %d\n", playerId, matchId);
        return true;
    } 
    else if (playerId == player2Id && player2Status == ConnectionStatus::DISCONNECTED) {
        player2Status = ConnectionStatus::CONNECTED;
        printf("Player %d reconnected to match %d\n", playerId, matchId);
        return true;
    }
    
    return false; // No se pudo reconectar (no era parte de la partida o ya estaba conectado)
}
