// Servidor de matchmaking simulado para pruebas
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 9001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Almacenamiento en memoria para las solicitudes de matchmaking
const waitingPlayers = [];
const activeMatches = {};

// Endpoint principal para matchmaking
app.post('/', (req, res) => {
  console.log('Solicitud recibida:', req.body);
  
  const { action, playerId, barajaId } = req.body;
  
  switch (action) {
    case 'joinMatch':
      handleJoinMatch(req, res);
      break;
    case 'leaveMatch':
      handleLeaveMatch(req, res);
      break;
    case 'checkStatus':
      handleCheckStatus(req, res);
      break;
    default:
      res.status(400).json({ 
        status: 'error', 
        message: `Acción desconocida: ${action}` 
      });
  }
});

// Manejar solicitudes para unirse a un partido
function handleJoinMatch(req, res) {
  const { playerId, barajaId, nombreBaraja } = req.body;
  
  // Validar que se envió el ID de la baraja
  if (!barajaId) {
    return res.json({
      status: 'error',
      message: 'Se requiere una baraja para unirse al matchmaking'
    });
  }
  
  // Verificar si el jugador ya está en espera
  const existingPlayer = waitingPlayers.find(p => p.playerId === playerId);
  if (existingPlayer) {
    return res.json({
      status: 'waiting',
      message: 'Ya estás en la cola de espera',
      position: waitingPlayers.indexOf(existingPlayer) + 1
    });
  }
  
  // Agregar jugador a la cola de espera
  waitingPlayers.push({
    playerId,
    barajaId,
    nombreBaraja,
    joinedAt: new Date()
  });
  
  // Si hay al menos 2 jugadores, crear un partido
  if (waitingPlayers.length >= 2) {
    const player1 = waitingPlayers.shift();
    const player2 = waitingPlayers.shift();
    
    // Crear un nuevo partido
    const matchId = `match_${Date.now()}`;
    activeMatches[matchId] = {
      matchId,
      createdAt: new Date(),
      players: [
        { playerId: player1.playerId, barajaId: player1.barajaId, nombreBaraja: player1.nombreBaraja },
        { playerId: player2.playerId, barajaId: player2.barajaId, nombreBaraja: player2.nombreBaraja }
      ],
      status: 'starting'
    };
    
    // Informar al jugador actual que se ha creado un partido
    return res.json({
      status: 'success',
      message: '¡Partido encontrado!',
      matchInfo: {
        matchId,
        opponent: player1.playerId === playerId ? 
          { playerId: player2.playerId, barajaNombre: player2.nombreBaraja } : 
          { playerId: player1.playerId, barajaNombre: player1.nombreBaraja }
      }
    });
  }
  
  // Si no hay suficientes jugadores, informar que está en espera
  return res.json({
    status: 'waiting',
    message: 'Esperando a más jugadores',
    position: waitingPlayers.length
  });
}

// Manejar solicitudes para abandonar un partido
function handleLeaveMatch(req, res) {
  const { playerId, matchId } = req.body;
  
  // Verificar si el matchId es válido
  if (!matchId || !activeMatches[matchId]) {
    return res.json({
      status: 'error',
      message: 'ID de partido no válido'
    });
  }
  
  // Eliminar el partido
  delete activeMatches[matchId];
  
  return res.json({
    status: 'success',
    message: 'Has abandonado el partido exitosamente'
  });
}

// Manejar solicitudes para verificar el estado
function handleCheckStatus(req, res) {
  const { playerId } = req.body;
  
  // Verificar si el jugador está en espera
  const waitingPosition = waitingPlayers.findIndex(p => p.playerId === playerId);
  if (waitingPosition >= 0) {
    return res.json({
      status: 'waiting',
      message: 'En espera de oponente',
      position: waitingPosition + 1
    });
  }
  
  // Verificar si el jugador está en un partido activo
  let activeMatch = null;
  for (const matchId in activeMatches) {
    const match = activeMatches[matchId];
    if (match.players.some(p => p.playerId === playerId)) {
      activeMatch = match;
      break;
    }
  }
  
  if (activeMatch) {
    return res.json({
      status: 'playing',
      matchInfo: activeMatch
    });
  }
  
  // No está ni esperando ni jugando
  return res.json({
    status: 'idle',
    message: 'No estás en ningún partido ni en espera'
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor de matchmaking simulado ejecutándose en http://localhost:${PORT}`);
});
