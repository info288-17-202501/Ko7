import React, { useState, useEffect } from "react";
import Card from './Card';
import HexCell from './HexCell';
import { useCardApi } from '../../API/useCardApi';
import './styles/animations.css';
import './styles/background.css';
import './styles/screen.css';
import './styles/buttons.css';

// Sistema de direcciones hexagonales
const HexDirection = {
  UP: { q: 0, r: -1 },
  TOP_RIGHT: { q: 1, r: -1 },
  BOTTOM_RIGHT: { q: 1, r: 0 },
  DOWN: { q: 0, r: 1 },
  BOTTOM_LEFT: { q: -1, r: 1 },
  TOP_LEFT: { q: -1, r: 0 }
};



// Mapa hexagonal central con vecinos
const HEX_MAP = [
  { q: 0, r: 0 }, // Centro
  { ...HexDirection.UP }, // Arriba
  { ...HexDirection.TOP_RIGHT }, // Superior derecha
  { ...HexDirection.BOTTOM_RIGHT }, // Inferior derecha
  { ...HexDirection.DOWN }, // Abajo
  { ...HexDirection.BOTTOM_LEFT }, // Inferior izquierda
  { ...HexDirection.TOP_LEFT }, // Superior izquierda

  // Segundo anillo
  { q: 0, r: -2 },                       // Dos arriba
  { q: 2, r: -1 },                       // Derecha arriba
  { q: 2, r: 0 },                        // Derecha 
  { q: 1, r: 1 },                        // Derecha abajo
  { q: 0, r: 2 },                        // Dos abajo
  { q: -1, r: 2 },                       // Abajo izquierda
  { q: -2, r: 2 },                       // Abajo izquierda 2
  { q: -2, r: 1 },  
  { q: -2, r: 3 },   
  { q: -1, r: 3 },
  { q: 0, r: 3 },
  { q: 1, r: 2 },
  { q: 2, r: 1 },
  { q: 0, r: 4 },                      
];

function GameBoard({ onBack, gameData = null, userData = null}) {
  // Usamos el hook de la API para obtener las cartas y las funciones
  const { cards, loading, error, fetchCards } = useCardApi();
  
  // Estados para la conexión del juego (cuando viene desde matchmaking)
  const [matchId, setMatchId] = useState(gameData?.matchId || null);
  const [gameServerIp, setGameServerIp] = useState(gameData?.gameServerIp || null);
  const [gameServerPort, setGameServerPort] = useState(gameData?.gameServerPort || null);
  const [gameSocket, setGameSocket] = useState(null);
  const [isConnectedToGameServer, setIsConnectedToGameServer] = useState(false);
  const [gameConnectionStatus, setGameConnectionStatus] = useState('disconnected');
  const [players, setPlayers] = useState(gameData?.players || []);
  const [myPlayerId] = useState(userData?.id || gameData?.playerId || null);
  
  // Estados para mensajes y notificaciones del game server
  const [gameMessages, setGameMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [customMessage, setCustomMessage] = useState(''); // Para el mensaje personalizado
  
  // Estado local para la interfaz del juego
  const [selectedHex, setSelectedHex] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardPositions, setCardPositions] = useState({});

  const [hoveredCard, setHoveredCard] = useState(null);
  const [clickedCard, setClickedCard] = useState(null);

  const [playerHand, setPlayerHand] = useState([]); // Cartas en la mano del jugador (máximo 7)
  const [deck, setDeck] = useState([]); // Baraja restante
  const [discardPile, setDiscardPile] = useState([]); // Cartas descartadas
  

  // Inicializar la baraja cuando se cargan las cartas
  useEffect(() => {
    if (cards.length > 0) {
      // Crear una copia de las cartas y barajarlas
      const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
      
      // Tomar las primeras 7 cartas para la mano inicial
      const initialHand = shuffledCards.slice(0, 7);
      const remainingDeck = shuffledCards.slice(7);
      
      setPlayerHand(initialHand);
      setDeck(remainingDeck);
      setDiscardPile([]);
    }
  }, [cards]);

  // Conectar al game server cuando tenemos los datos necesarios
  useEffect(() => {
    if (gameServerIp && gameServerPort && matchId && myPlayerId && !gameSocket) {
      console.log(`[Game.jsx] Conectando al game server: ${gameServerIp}:${gameServerPort} para match ${matchId}`);
      connectToGameServer();
    }
  }, [gameServerIp, gameServerPort, matchId, myPlayerId, gameSocket]);

  // Cleanup del socket cuando se desmonta el componente
  useEffect(() => {
    return () => {
      if (gameSocket) {
        console.log('[Game.jsx] Cerrando conexión al game server');
        gameSocket.close();
      }
    };
  }, [gameSocket]);

  // Función para conectar al game server
  const connectToGameServer = () => {
    try {
      const wsUrl = `ws://localhost:${gameServerPort}`;
      console.log(`[Game.jsx] Conectando por WebSocket a: ${wsUrl}`);
      setGameConnectionStatus('connecting');
      
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = function() {
        console.log(`[Game.jsx] ✅ Conectado al Game Server`);
        setIsConnectedToGameServer(true);
        setGameConnectionStatus('connected');
        
        // Identificarse con el servidor
        const identifyMessage = {
          type: 'identify',
          playerId: myPlayerId,
          matchId: matchId
        };
        
        console.log(`[Game.jsx] Enviando identificación:`, identifyMessage);
        socket.send(JSON.stringify(identifyMessage));
      };
      
      socket.onmessage = function(event) {
        try {
          const message = JSON.parse(event.data);
          console.log(`[Game.jsx] 📥 Mensaje del Game Server:`, message);
          handleGameServerMessage(message);
        } catch (error) {
          console.log(`[Game.jsx] 📥 Mensaje del servidor: ${event.data}`);
        }
      };
      
      socket.onclose = function(event) {
        console.log(`[Game.jsx] 🔌 Conexión cerrada:`, {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          url: wsUrl
        });
        setIsConnectedToGameServer(false);
        setGameConnectionStatus('disconnected');
      };
      
      socket.onerror = function(error) {
        console.error(`[Game.jsx] ❌ Error detallado:`, {
          error,
          url: wsUrl,
          readyState: socket.readyState,
          gameServerIp,
          gameServerPort,
          matchId
        });
        setGameConnectionStatus('error');
      };
      
      setGameSocket(socket);
      
    } catch (error) {
      console.error('[Game.jsx] Error conectando al game server:', error);
      setGameConnectionStatus('error');
    }
  };

  // Función para manejar mensajes del game server
  const handleGameServerMessage = (message) => {
    switch (message.type) {
      case 'gameState':
        console.log('[Game.jsx] Estado del juego recibido:', message);
        // Aquí puedes actualizar el estado del juego según los datos recibidos
        break;
      case 'playerMove':
        console.log('[Game.jsx] Movimiento de jugador recibido:', message);
        // Manejar movimientos de otros jugadores
        break;
      case 'playerMessage':
        console.log('[Game.jsx] Mensaje de jugador recibido:', message);
        handlePlayerMessage(message);
        break;
      case 'error':
        console.error('[Game.jsx] Error del game server:', message.error);
        addNotification(`❌ Error: ${message.error}`, 'error');
        break;
      default:
        console.log('[Game.jsx] Mensaje no manejado:', message);
    }
  };

  // Función para manejar mensajes de jugadores
  const handlePlayerMessage = (message) => {
    const { fromPlayerId, matchId: msgMatchId, content } = message;
    
    // Verificar que el mensaje es para este match
    if (msgMatchId !== matchId) {
      console.warn('[Game.jsx] Mensaje recibido para un match diferente:', msgMatchId, 'vs', matchId);
      return;
    }

    // Solo procesar mensajes de otros jugadores (los propios ya se agregan inmediatamente)
    if (fromPlayerId !== myPlayerId) {
      // Crear el objeto del mensaje
      const newMessage = {
        id: Date.now() + Math.random(),
        fromPlayerId,
        content,
        timestamp: new Date().toLocaleTimeString(),
        isMyMessage: false
      };

      // Agregar a la lista de mensajes
      setGameMessages(prev => [...prev, newMessage]);

      // Mostrar notificación para mensajes de otros jugadores
      addNotification(`💬 Jugador ${fromPlayerId}: ${content}`, 'message');
    }
    // Si es mi propio mensaje, no hacer nada (ya se agregó al enviarlo)
  };

  // Función para agregar notificaciones
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remover la notificación después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Función para enviar mensajes al game server
  const sendToGameServer = (message) => {
    if (gameSocket && gameSocket.readyState === WebSocket.OPEN) {
      console.log('[Game.jsx] Enviando al game server:', message);
      gameSocket.send(JSON.stringify(message));
    } else {
      console.warn('[Game.jsx] Game socket no está conectado, no se puede enviar:', message);
    }
  };

  // Función para robar una carta de la baraja
  const drawCard = () => {
    if (playerHand.length >= 7) {
      console.log("No puedes tener más de 7 cartas en la mano");
      return;
    }
    
    if (deck.length === 0) {
      console.log("No hay más cartas en la baraja");
      return;
    }
    
    const newCard = deck[0];
    const newDeck = deck.slice(1);
    const newHand = [...playerHand, newCard];
    
    setDeck(newDeck);
    setPlayerHand(newHand);
    
    console.log(`Carta robada: ${newCard.name}`);
  };

  // Función modificada para cuando se juega una carta
  const removeCardFromHand = (cardId) => {
    const newHand = playerHand.filter(card => card.id.toString() !== cardId.toString());
    setPlayerHand(newHand);
  };

  const handleCardClick = (card) => {
    console.log("Carta clickeada:", card);
    // Si ya está seleccionada, deseleccionarla
    if (clickedCard && clickedCard.id === card.id) {
      setClickedCard(null);
    } else {
      // De lo contrario, seleccionarla
      setClickedCard(card);
    }
    // Importante: anular el hover para evitar conflictos
    setHoveredCard(null);
  };

  // Manejador para click en celdas hexagonales
  const handleHexClick = (q, r) => {
    const hexKey = `${q},${r}`;
    const cardHere = cardPositions[hexKey];
    
    console.log(`Celda seleccionada: (q: ${q}, r: ${r})`);

    if (selectedCard) {
      moveSelectedCardTo(q, r);
    } else if (cardHere) {
      // Usamos directamente cardHere que ya contiene los datos actualizados
      setSelectedCard({
        ...cardHere,
        originalPosition: { q, r }
      });
    } else {
      setSelectedHex({ q, r });
    }
  };  // Función para mover una carta seleccionada a una nueva posición
  // Función para mover una carta seleccionada a una nueva posición
const moveSelectedCardTo = (q, r) => {
  if (!selectedCard) return;
  
  const newPositionKey = `${q},${r}`;
  const originalPositionKey = `${selectedCard.originalPosition.q},${selectedCard.originalPosition.r}`;
  
  // Verificar si ya hay una carta en la celda destino
  if (cardPositions[newPositionKey]) {
    console.log("Ya hay una carta en esta posición");
    return;
  }
  
  // Crear nuevo objeto de posiciones
  const newCardPositions = { ...cardPositions };
  
  // Eliminar la posición original solo si es diferente a la nueva posición
  if (originalPositionKey !== newPositionKey && newCardPositions[originalPositionKey]) {
    delete newCardPositions[originalPositionKey];
  }
  
  // Obtener datos de la carta desde el array de cartas
  const cardInfo = cards.find(c => c.id.toString() === selectedCard.id.toString());

  
  // Debugging
  console.log("moveSelectedCardTo - Stats en selectedCard:", JSON.stringify(selectedCard.stats));
  console.log("moveSelectedCardTo - Stats en cardInfo:", cardInfo ? JSON.stringify(cardInfo.stats) : "No cardInfo");
  
  // Asegurarse de que stats es un objeto válido
  let finalStats = null;
  if (selectedCard.stats && typeof selectedCard.stats === 'object') {
    finalStats = selectedCard.stats;
  } else if (cardInfo && cardInfo.stats && typeof cardInfo.stats === 'object') {
    finalStats = cardInfo.stats;
  }
  
  console.log("moveSelectedCardTo - finalStats:", JSON.stringify(finalStats));

  // Actualizar la posición de la carta
  setCardPositions({
    ...newCardPositions,
    [newPositionKey]: {
      id: selectedCard.id,
      type: selectedCard.type,
      name: selectedCard.name,
      rarity: selectedCard.rarity,
      stats: finalStats,
      effects: selectedCard.effects || cardInfo?.effects,
      image: selectedCard.image || cardInfo?.image
    }
  });
  
  setSelectedCard(null);
  setSelectedHex(null);
};

// Manejador para arrastrar y soltar cartas
  const handleDrop = (e, q, r) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("cardId");
    const cardType = e.dataTransfer.getData("cardType");
    
    if (cardId) {
      // Verificar si la carta ya está en el tablero
      const isCardOnBoard = Object.entries(cardPositions).some(([pos, card]) => 
        String(card.id) === String(cardId)
      );
      
      if (isCardOnBoard) {
        console.log("Esta carta ya está en el tablero");
        return;
      }
      
      const cardName = e.dataTransfer.getData("cardName");
      const cardRarity = e.dataTransfer.getData("cardRarity");
      
      // Obtener la información completa de la carta desde playerHand
      const fullCardData = playerHand.find(c => c.id.toString() === cardId.toString());
      
      if (!fullCardData) {
        console.log("Esta carta no está en tu mano");
        return;
      }
      
      // Intentar obtener stats desde dataTransfer
      let statsFromDrag = null;
      try {
        const statsData = e.dataTransfer.getData("cardStats");
        if (statsData) {
          statsFromDrag = JSON.parse(statsData);
        }
      } catch (error) {
        console.error("Error al parsear las estadísticas desde dataTransfer:", error);
      }
      
      // Usar stats de tres posibles fuentes, en orden de prioridad
      const finalStats = statsFromDrag || fullCardData?.stats || null;
      
      // Colocar la carta en el tablero
      setCardPositions(prevPositions => ({
        ...prevPositions,
        [`${q},${r}`]: { 
          id: cardId, 
          type: cardType,
          name: cardName,
          rarity: cardRarity,
          stats: finalStats,
          effects: fullCardData?.effects,
          image: fullCardData?.image
        }
      }));
      
      // Remover la carta de la mano del jugador
      removeCardFromHand(cardId);
      
      console.log(`Carta ${cardName} jugada. Cartas en mano: ${playerHand.length - 1}`);
    }
  };

  const handleExitGame = () => {
        console.log("🚪 Saliendo del juego...");
        console.log("🔌 Cerrando conexiones...");
        
        //deberias poner todo aqui :D

        
        if (onBack) {
            onBack();
        }
  };

  // Manejador para permitir soltar elementos
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Cancelar la selección actual
  const cancelSelection = () => {
    setSelectedCard(null);
  };
  
  // Mostrar mensaje de carga mientras se obtienen las cartas
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px' }}>
        Cargando cartas desde la base de datos...
      </div>
    );
  }
  
  // Mostrar mensaje de error si falla la carga
  if (error) {
    return (
      <div  style={{ 
        textAlign: 'center', 
        padding: '50px', 
        color: 'red', 
        fontSize: '18px', 
        backgroundColor: '#ffeeee',
        border: '1px solid red',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3>Error al cargar las cartas</h3>
        <p>{error}</p>
        <button 
          onClick={fetchCards} 
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Agregar esta función antes del return en GameBoard()
  const renderMovementGridForHover = (movements) => {
    if (!movements || movements.length === 0) return null;
    
    const grid = [
      ['↖', '↑', '↗'],
      ['←', '·', '→'],
      ['↙', '↓', '↘']
    ];
    
    const directionMap = {
      'TOP_LEFT': [0, 0],
      'TOPLEFT': [0, 0],
      'UP': [0, 1],
      'TOP': [0, 1],
      'TOP_RIGHT': [0, 2],
      'TOPRIGHT': [0, 2],
      'LEFT': [1, 0],
      'RIGHT': [1, 2],
      'BOTTOM_LEFT': [2, 0],
      'BOTTOMLEFT': [2, 0],
      'DOWN': [2, 1],
      'BOTTOM': [2, 1],
      'BOTTOM_RIGHT': [2, 2],
      'BOTTOMRIGHT': [2, 2]
    };
    
    let processedMovements = movements;
    
    if (movements.length > 0 && typeof movements[0] === 'string') {
      processedMovements = movements.map(direction => ({
        direction: direction,
        targetType: 'Enemy'
      }));
    }

    const movementsByTarget = {};

    if (processedMovements && !Array.isArray(processedMovements) && typeof processedMovements === 'object') {
      for (const [direction, value] of Object.entries(processedMovements)) {
        const targetType = 'Enemy';
        if (!movementsByTarget[targetType]) {
          movementsByTarget[targetType] = [];
        }
        movementsByTarget[targetType].push({
          direction: direction,
          targetType: targetType
        });
      }
    } else {
      processedMovements.forEach(movement => {
        if (typeof movement !== 'object') {
          movement = { direction: movement, targetType: 'Enemy' };
        }
        
        const targetType = movement.targetType || 'Enemy';
        if (!movementsByTarget[targetType]) {
          movementsByTarget[targetType] = [];
        }
        movementsByTarget[targetType].push(movement);
      });
    }
    
    return (
      <div>
        {Object.entries(movementsByTarget).map(([targetType, targetMovements]) => {
          const directions = targetMovements.map(m => m.direction);
          
          return (
            <div key={targetType} style={{ marginBottom: '15px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                marginBottom: '8px',
                textAlign: 'center',
                color: '#fff'
              }}>
                {targetType === "Aliado" ? '🔵' : '🔴'} 
                {' '}Movimientos ({targetType})
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 30px)',
                gridTemplateRows: 'repeat(3, 30px)',
                gap: '2px',
                justifyContent: 'center'
              }}>
                {Array.from({ length: 9 }).map((_, index) => {
                  const i = Math.floor(index / 3);
                  const j = index % 3;
                  
                  if (i === 1 && j === 1) {
                    return (
                      <div key={index} style={{
                        width: '30px',
                        height: '30px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        ⭐
                      </div>
                    );
                  }
                  
                  let direction = null;
                  for (const [dir, [row, col]] of Object.entries(directionMap)) {
                    if (row === i && col === j) {
                      direction = dir;
                      break;
                    }
                  }
                  
                  if (direction) {
                    const directionMatches = directions.map(d => d.toUpperCase()).includes(direction.toUpperCase());
                    const movement = targetMovements.find(m => 
                      m.direction && m.direction.toUpperCase() === direction.toUpperCase()
                    );
                    
                    return (
                      <div key={index} style={{
                        width: '30px',
                        height: '30px',
                        backgroundColor: directionMatches ? '#4CAF50' : '#f0f0f0',
                        color: directionMatches ? 'white' : 'black',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        fontSize: '12px',
                        position: 'relative'
                      }}>
                        {grid[i][j]}
                        {movement && movement.range && (
                          <span style={{
                            fontSize: '8px',
                            position: 'absolute',
                            bottom: '2px',
                            right: '2px'
                          }}>
                            {movement.range}
                          </span>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <div key={index} style={{
                        width: '30px',
                        height: '30px',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {grid[i][j]}
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Estilos para las animaciones de notificaciones */}
      <style>
        {`
          @keyframes slideInFromRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    
    <div style={{ 
      padding: 'auto', 
      fontFamily: 'Arial, sans-serif',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'scroll',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      backgroundColor: 'rgba(21, 10, 31, 0.9)',
    
    }}>
        <div className="scanlines"></div>

      
            {/* ← BOTÓN DE SALIR - ESQUINA SUPERIOR IZQUIERDA */}
            <button 
                onClick={handleExitGame}
                className="cybr-btn small danger aggressive-shape"
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    zIndex: 100,
                    backgroundColor: 'transparent',
                    fontSize: '14px',
                    padding: '8px 16px'
                }}
            >
                Salir<span aria-hidden></span>
                <span aria-hidden className="cybr-btn__glitch">Exit Game</span>
                <span aria-hidden className="cybr-btn__tag custom">ESC</span>
            </button>

          <h1 className="rgb-text-effect" style={{ 
            textAlign: 'center', 
            marginBottom: '3%',
            fontSize: '1.5rem',
          }}>
          {'HeXacrillage'.split('').map((char, index) => (
          <span 
            key={index} 
            className="char" 
            style={{'--char-index': index}}
          >
            {char}
          </span>
        ))}
        </h1> 

        {/* Información del match cuando viene desde matchmaking */}
        {(matchId || gameServerIp) && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '10px 15px',
            borderRadius: '8px',
            border: `2px solid ${gameConnectionStatus === 'connected' ? '#4caf50' : gameConnectionStatus === 'connecting' ? '#ff9800' : '#f44336'}`,
            color: '#fff',
            fontSize: '12px',
            zIndex: 100,
            minWidth: '200px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#00ff88' }}>
              🎮 MATCH INFO
            </div>
            {matchId && (
              <div>Match ID: <span style={{ color: '#ffeb3b' }}>{matchId}</span></div>
            )}
            {gameServerIp && gameServerPort && (
              <div>Server: <span style={{ color: '#2196f3' }}>{gameServerIp}:{gameServerPort}</span></div>
            )}
            <div>Estado: <span style={{ 
              color: gameConnectionStatus === 'connected' ? '#4caf50' : 
                     gameConnectionStatus === 'connecting' ? '#ff9800' : '#f44336' 
            }}>
              {gameConnectionStatus === 'connected' ? '🟢 Conectado' :
               gameConnectionStatus === 'connecting' ? '🟡 Conectando...' :
               gameConnectionStatus === 'error' ? '🔴 Error' : '⚫ Desconectado'}
            </span></div>
            {players && players.length > 0 && (
              <div>Jugadores: <span style={{ color: '#e91e63' }}>{players.join(', ')}</span></div>
            )}
            {myPlayerId && (
              <div>Mi ID: <span style={{ color: '#9c27b0' }}>{myPlayerId}</span></div>
            )}
            {/* Input y botón para enviar mensajes personalizados al game server */}
            {isConnectedToGameServer && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && customMessage.trim()) {
                      const messageToSend = customMessage.trim();
                      sendToGameServer({
                        type: 'playerMessage',
                        playerId: myPlayerId,
                        matchId: matchId,
                        content: messageToSend
                      });
                      // También agregarlo localmente al chat (mensaje propio)
                      const myMessage = {
                        id: Date.now() + Math.random(),
                        fromPlayerId: myPlayerId,
                        content: messageToSend,
                        timestamp: new Date().toLocaleTimeString(),
                        isMyMessage: true
                      };
                      setGameMessages(prev => [...prev, myMessage]);
                      
                      // Notificación de confirmación
                      addNotification(`📤 Mensaje enviado`, 'info');
                      setCustomMessage(''); // Limpiar el input
                    }
                  }}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '10px',
                    width: '100%'
                  }}
                />
                <button
                  onClick={() => {
                    if (customMessage.trim()) {
                      const messageToSend = customMessage.trim();
                      sendToGameServer({
                        type: 'playerMessage',
                        playerId: myPlayerId,
                        matchId: matchId,
                        content: messageToSend
                      });
                      // También agregarlo localmente al chat (mensaje propio)
                      const myMessage = {
                        id: Date.now() + Math.random(),
                        fromPlayerId: myPlayerId,
                        content: messageToSend,
                        timestamp: new Date().toLocaleTimeString(),
                        isMyMessage: true
                      };
                      setGameMessages(prev => [...prev, myMessage]);
                      
                      // Notificación de confirmación
                      addNotification(`📤 Mensaje enviado`, 'info');
                      setCustomMessage(''); // Limpiar el input
                    }
                  }}
                  disabled={!customMessage.trim()}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: customMessage.trim() ? '#4caf50' : '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: customMessage.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '10px',
                    width: '100%'
                  }}
                >
                  💬 Enviar mensaje
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notificaciones flotantes */}
        {notifications.length > 0 && (
          <div style={{
            position: 'fixed',
            top: '100px',
            right: '20px',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '300px'
          }}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  backgroundColor: notification.type === 'error' ? 'rgba(244, 67, 54, 0.9)' :
                                   notification.type === 'message' ? 'rgba(33, 150, 243, 0.9)' :
                                   'rgba(76, 175, 80, 0.9)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  animation: 'slideInFromRight 0.3s ease-out',
                  wordWrap: 'break-word',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setNotifications(prev => prev.filter(n => n.id !== notification.id));
                }}
              >
                {notification.message}
              </div>
            ))}
          </div>
        )}

        {/* Panel de chat para mostrar mensajes del game server - SIEMPRE VISIBLE */}
        {(matchId && gameServerIp) && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            width: '350px',
            height: '250px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            border: '2px solid rgba(0, 255, 136, 0.5)',
            borderRadius: '12px',
            padding: '15px',
            zIndex: 150,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#00ff88',
              marginBottom: '10px',
              borderBottom: '1px solid rgba(0, 255, 136, 0.3)',
              paddingBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>💬 Chat del Match {matchId}</span>
              <span style={{ fontSize: '10px', color: '#888' }}>
                {gameMessages.length} mensaje{gameMessages.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '5px'
            }}>
              {gameMessages.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#666',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.3 }}>💬</div>
                  <div style={{ fontSize: '11px' }}>No hay mensajes aún</div>
                  <div style={{ fontSize: '10px', marginTop: '4px' }}>¡Escribe algo para comenzar!</div>
                </div>
              ) : (
                gameMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: msg.isMyMessage ? 
                        'rgba(0, 255, 136, 0.15)' : 
                        'rgba(33, 150, 243, 0.15)',
                      border: `1px solid ${msg.isMyMessage ? 'rgba(0, 255, 136, 0.3)' : 'rgba(33, 150, 243, 0.3)'}`,
                      alignSelf: msg.isMyMessage ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      wordWrap: 'break-word'
                    }}
                  >
                    <div style={{
                      color: msg.isMyMessage ? '#00ff88' : '#2196f3',
                      fontSize: '10px',
                      marginBottom: '4px',
                      fontWeight: 'bold'
                    }}>
                      {msg.isMyMessage ? `Tú (${myPlayerId})` : `Jugador ${msg.fromPlayerId}`} • {msg.timestamp}
                    </div>
                    <div style={{ color: '#fff', lineHeight: '1.3' }}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                onClick={() => setGameMessages([])}
                disabled={gameMessages.length === 0}
                style={{
                  padding: '6px 12px',
                  backgroundColor: gameMessages.length > 0 ? 'rgba(244, 67, 54, 0.8)' : 'rgba(100, 100, 100, 0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '10px',
                  cursor: gameMessages.length > 0 ? 'pointer' : 'not-allowed',
                  flex: 1
                }}
              >
                🗑️ Limpiar ({gameMessages.length})
              </button>
              <div style={{
                fontSize: '9px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px'
              }}>
                Estado: {isConnectedToGameServer ? '🟢 Online' : '🔴 Offline'}
              </div>
            </div>
          </div>
        )}
    
      
      {/* Indicador de carta seleccionada - Posición actualizada y z-index aumentado */}
      {selectedCard && (
        <div 
          style={{ 
            
            position: 'fixed',
            bottom: '10%',
            height: '25px',
            width: '300px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center', 
            padding: '5px 10px',
            backgroundColor: 'rgba(227, 242, 253, 0.9)',
            borderRadius: '8px',
            border: '1px solid #2196f3',
            zIndex: 9999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
          <span>Carta seleccionada: {selectedCard.type}{selectedCard.id}</span>
          <button 
            onClick={cancelSelection}
            style={{
              marginLeft: '10px',
              padding: '3px 8px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Cancelar
          </button>
        </div>
      )}
      
      {/* Contenedor del mapa - Ahora posicionado más arriba */}
      <div className="mapBorder offsetBorder"
        style={{ 
          width: '95vh', //350 px de ancho para que quede justo :b
          maxWidth: '100%',
          height: '600px',
          minHeight: '600px',
          maxHeight: '700px',
          position: 'relative',
          right: '0%',
          margin: '0 auto 0% 47vh',
          backgroundColor: 'rgb(46, 22, 69)',
          overflow: 'visible',
          zIndex: 10,

          display: 'flex',
          flexDirection: 'column',       
          justifyContent: 'center', 
          alignSelf: 'center',    
          
        }}
      >
        {HEX_MAP.map((hex, index) => {
          const hexKey = `${hex.q},${hex.r}`;
          const cardData = cardPositions[hexKey];
          const isSelected = selectedHex && 
                selectedHex.q === hex.q && 
                selectedHex.r === hex.r;
          const hasSelectedCard = selectedCard && 
                selectedCard.originalPosition.q === hex.q && 
                selectedCard.originalPosition.r === hex.r;
          
          return (
            <HexCell
              key={`${hex.q},${hex.r}`}
              q={hex.q}
              r={hex.r}
              centerX={0}        // ahora las coords se basan en este wrapper
              centerY={0}
              onClick={handleHexClick}
              selected={isSelected || hasSelectedCard}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >              
            {cardData && (
              <div 
                onClick={(e) => {
                  // Evitar que el click llegue al hexágono
                  e.stopPropagation();
                  // Obtener toda la información de la carta
                  const fullCardData = cards.find(c => c.id.toString() === cardData.id.toString()) || cardData;
                  // Construir objeto completo
                  const completeCard = {
                    ...fullCardData,
                    ...cardData,
                    id: cardData.id,
                    type: cardData.type,
                    name: cardData.name,
                    rarity: cardData.rarity
                  };
                  handleCardClick(completeCard);
                }}
                style={{
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <Card 
                  id={cardData.id}
                  type={cardData.type}
                  color={cards.find(c => c.id.toString() === cardData.id.toString())?.color || '#666'}
                  name={cardData.name}
                  rarity={cardData.rarity}
                  description={cards.find(c => c.id.toString() === cardData.id.toString())?.description}
                  stats={cardData.stats || cards.find(c => c.id.toString() === cardData.id.toString())?.stats}
                  effects={cardData.effects || cards.find(c => c.id.toString() === cardData.id.toString())?.effects}
                  image={cards.find(c => c.id.toString() === cardData.id.toString())?.image}
                  isSmall={true}
                  inBoard={true}
                  onCardHover={() => {}}
                  onCardLeave={() => {}}
                />
              </div>
            )}
            </HexCell>
          );
        })}
      </div>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '5px',
        fontSize: '12px',
        color: '#666',
        paddingBottom: '5px'
      }}>
        <p style={{margin: '0'}}>Arrastra las cartas al tablero o haz clic en una carta en el tablero para seleccionarla y moverla</p>
      </div>
      
      {/* Contenedor inferior con mano del jugador y baraja */}
      <div style={{
        display: 'flex',
        gap: '1px',
        margin: '0 auto 5%',
        width: '80%',
        maxWidth: '100%',
        justifyContent: 'center',
        alignItems: 'flex-start',
        zIndex: 1000,
      }}>
        
        {/* Contenedor de cartas en mano - REDUCIDO para 7 cartas máximo */}
        <div className="loading animated fadeIn offsetBorder" style={{ 
          width: '500px', // Reducido para acomodar solo 7 cartas
          height: '100px',
          maxHeight: '200px',
          minHeight: '100px',
          padding: '15px',
          borderRadius: '10px',
          border: '3px solid rgb(255, 234, 0)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          flexWrap: 'nowrap',
          flexDirection: 'row',
          gap: '8px',
          position: 'relative',
          zIndex: 100,
          overflowX: 'hidden',
          overflowY: 'hidden'
        }}>
          <div className="bg"></div>
          
          {/* Cartas en mano - IMAGEN ARREGLADA */}
          {playerHand.map(card => {
            const isCardOnBoard = Object.values(cardPositions).some(pos => 
              String(pos.id) === String(card.id)
            );
            
            return !isCardOnBoard && (
              <div 
                key={card.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("🖱️ CLICK en carta de mano:", card.name);
                  handleCardClick(card);
                }}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  transform: clickedCard && clickedCard.id === card.id ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.2s ease',
                  zIndex: clickedCard && clickedCard.id === card.id ? 1000 : 100
                }}
              >
              <Card 
                key={card.id} 
                id={card.id} 
                type={card.type} 
                color={card.color}
                name={card.name}
                rarity={card.rarity}
                description={card.description}
                stats={card.stats}
                effects={card.effects}
                image={card.image} 
                isSmall={true}
                onCardHover={() => {}}
                onCardLeave={() => {}}
                onCardClick={() => handleCardClick(card)}
              />
              </div>
            );
          })}
          
          {/* Mostrar espacios vacíos para indicar capacidad máxima */}
          {Array.from({ length: 7 - playerHand.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              style={{
                width: '60px',
                height: '80px',
                border: '2px dashed rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
                flexShrink: 0
              }}
            >
              +
            </div>
          ))}
        </div>

        {/* Baraja */}
        <div className="deck-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          {/* Baraja principal */}
          <div 
            className="deck offsetBorder"
            onClick={drawCard}
            style={{
              width: '80px',
              height: '100px',
              backgroundColor: 'rgba(47, 17, 75, 0.9)',
              border: '3px solid rgb(0, 255, 255)',
              marginTop: '50px',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: deck.length > 0 && playerHand.length < 7 ? 'pointer' : 'not-allowed',
              position: 'relative',
              transition: 'all 0.3s ease',
              opacity: deck.length > 0 && playerHand.length < 7 ? 1 : 0.5
            }}
          >
            <div style={{
              fontSize: '24px',
              marginBottom: '5px'
            }}>
              🃏
            </div>
            <div style={{
              fontSize: '10px',
              color: '#fff',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {deck.length}
            </div>
          </div>
          
          {/* Indicador de estado */}
          <div style={{
            fontSize: '8px',
            color: '#ccc',
            textAlign: 'center',
            maxWidth: '80px'
          }}>
            {playerHand.length >= 7 ? 'Mano llena' : 
             deck.length === 0 ? 'Baraja vacía' : 
             'Click para robar'}
          </div>
        </div>
      </div>
      
      {/* Información de la mano */}
      <div style={{ 
        textAlign: 'center',
        margin: '0 0 10px 0',
        fontSize: '12px',
        color: '#ccc'
      }}>
        Cartas en mano: {playerHand.length}/7 | Cartas en baraja: {deck.length}
      </div>
      {/* Pie de página con información de la API */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '1px',
        fontSize: '11px',
        color: '#999',
        paddingBottom: '1px'
      }}>
        <p style={{margin: '0'}}>
          Conectado a API - Base de datos PostgreSQL: Card Details DB
          {error && " | Estado: Error de conexión"}
          {loading && " | Estado: Cargando datos..."}
          {!error && !loading && " | Estado: Conectado"}
        </p>
      </div>


      {/* Panel de información de carta al hacer hover - ACTUALIZADO */}
      <div className="offsetBorder" style={{
        position: 'fixed',
        right: '2%',
        top: '45%',
        transform: 'translateY(-50%)',
        width: '450px',
        maxHeight: '800px',
        padding: '20px',
        backgroundColor: 'rgba(31, 15, 47, 0.96)',
        border: '2px solid rgb(255, 255, 255)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        zIndex: 100,
        boxShadow: '0 4px 15px rgb(255, 255, 255)',
        backdropFilter: 'blur(5px)',
        overflowY: 'scroll',
        overflowX: 'hidden',
      }}>
      
      {clickedCard ? (
          <>
            {/* Header con botón para cerrar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                Carta seleccionada
              </span>
              <button
                onClick={() => setClickedCard(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              flex: 1, // OCUPA EL ESPACIO RESTANTE
              minHeight: 0 // IMPORTANTE: permite que el contenido crezca naturalmente
            }}>

                {/* Header de la carta con ID y tipo */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 15px',
                  backgroundColor: clickedCard.color || '#666',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 'bold',
                  flexShrink: 0, // Evita que se reduzca el tamaño
                }}>
                  <span style={{ fontSize: '18px' }}>#{clickedCard.id || 'N/A'}</span>
                  <span style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {clickedCard.type === 'legend' ? 'Personaje' :
                    clickedCard.type === 'unit' ? 'Aliado' :
                    clickedCard.type === 'spell' ? 'Hechizo' :
                    clickedCard.type || 'Unknown'}
                  </span>
                </div>

                {/* Imagen de la carta - ARREGLADO */}
                {clickedCard.image ? (
                  <div style={{
                    width: '70%',
                    aspectRatio: '350 / 453',
                    overflow: 'hidden',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    position: 'relative',
                    alignSelf: 'center',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    flexShrink: 0, // Evita que se reduzca el tamaño
                  }}>
                    <img 
                      key={clickedCard.id} // SIMPLIFICADO - solo usar el ID
                      src={clickedCard.image} 
                      alt={clickedCard.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        opacity: '1' // FIJO en 1, sin transiciones complicadas
                      }}
                      onLoad={(e) => {
                        console.log(`Imagen cargada: ${clickedCard.name} - ${clickedCard.image}`);
                      }}
                      onError={(e) => {
                        console.error(`Error cargando imagen: ${clickedCard.name} - ${clickedCard.image}`);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '48px', 
                      marginBottom: '10px',
                      opacity: 0.5 
                    }}>
                      🃏
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#ccc'
                    }}>
                      Sin imagen disponible
                    </div>
                  </div>
                )}

                {/* Nombre de la carta */}
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  textAlign: 'center',
                  color: '#fff'
                }}>
                  {clickedCard.name || 'Unnamed'}
                </div>

                {/* Rareza */}
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: '12px', 
                  fontStyle: 'italic', 
                  color: '#ccc',
                  backgroundColor: 'rgba(255,255,255,0.1)', 
                  padding: '4px 8px', 
                  borderRadius: '10px', 
                  alignSelf: 'center' 
                }}>
                  {clickedCard.rarity || 'Common'}
                </div>

                {/* Estadísticas */}
                {(clickedCard.stats?.attack !== undefined || 
                  clickedCard.stats?.health !== undefined || 
                  clickedCard.stats?.cost !== undefined || 
                  clickedCard.stats?.actions !== undefined ||
                  clickedCard.attack !== undefined || 
                  clickedCard.health !== undefined || 
                  clickedCard.cost !== undefined || 
                  clickedCard.actions !== undefined) && (
                  <div style={{ 
                    backgroundColor: 'rgba(255,255,255,0.05)', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    border: '1px solid rgba(255,255,255,0.1)' 
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      marginBottom: '10px', 
                      textAlign: 'center',
                      color: '#fff'
                    }}>
                      Estadísticas
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-around',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      {(clickedCard.stats?.attack !== undefined || clickedCard.attack !== undefined) && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', marginBottom: '5px' }}>⚔️</div>
                          <div style={{ fontWeight: 'bold', color: '#fff' }}>
                            {clickedCard.stats?.attack || clickedCard.attack}
                          </div>
                          <div style={{ fontSize: '10px', color: '#ccc' }}>Ataque</div>
                        </div>
                      )}
                      {(clickedCard.stats?.health !== undefined || clickedCard.health !== undefined) && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', marginBottom: '5px' }}>❤️</div>
                          <div style={{ fontWeight: 'bold', color: '#fff' }}>
                            {clickedCard.stats?.health || clickedCard.health}
                          </div>
                          <div style={{ fontSize: '10px', color: '#ccc' }}>Vida</div>
                        </div>
                      )}
                      {(clickedCard.stats?.cost !== undefined || clickedCard.cost !== undefined) && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', marginBottom: '5px' }}>💎</div>
                          <div style={{ fontWeight: 'bold', color: '#fff' }}>
                            {clickedCard.stats?.cost || clickedCard.cost}
                          </div>
                          <div style={{ fontSize: '10px', color: '#ccc' }}>Costo</div>
                        </div>
                      )}
                      {(clickedCard.stats?.actions !== undefined || clickedCard.actions !== undefined) && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', marginBottom: '5px' }}>🏃</div>
                          <div style={{ fontWeight: 'bold', color: '#fff' }}>
                            {clickedCard.stats?.actions || clickedCard.actions}
                          </div>
                          <div style={{ fontSize: '10px', color: '#ccc' }}>Acciones</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Efectos */}
                {(clickedCard.effects && clickedCard.effects.length > 0) && (
                  <div style={{ 
                    backgroundColor: 'rgba(255,255,255,0.05)', 
                    padding: '12px', 
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      marginBottom: '8px',
                      color: '#fff'
                    }}>
                      Efectos
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {clickedCard.effects.map((effect, index) => (
                        <div key={index} style={{
                          fontSize: '10px',
                          padding: '6px 8px',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          color: '#ddd'
                        }}>
                          <strong style={{ color: '#fff' }}>
                            {effect.name || 'Unnamed Effect'}:
                          </strong> {effect.description || 'No description'}
                          {effect.amount > 1 && (
                            <span style={{ color: '#ffeb3b' }}> (x{effect.amount})</span>
                          )}
                          {effect.target && (
                            <span style={{ color: '#4caf50' }}> [{effect.target}]</span>
                          )}
                          {effect.duration > 1 && (
                            <span style={{ color: '#2196f3' }}> ({effect.duration} turnos)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Movimientos/Flechas */}
                {(clickedCard.arrows && clickedCard.arrows.length > 0) && (
                  <div style={{ 
                    backgroundColor: 'rgba(255,255,255,0.05)', 
                    padding: '12px', 
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      marginBottom: '8px',
                      textAlign: 'center',
                      color: '#fff'
                    }}>
                      Patrones de Movimiento
                    </div>
                    {renderMovementGridForHover(clickedCard.arrows)}
                  </div>
                )}
                </div>
              </>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flex: 1, 
                color: '#888', 
                textAlign: 'center',
                height: '300px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}>🃏</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  Panel de Información
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  Haz click en una carta para ver sus detalles
                </div>
              </div>
          )}
      </div>
    </div>
    </>
  );
}

export default GameBoard;
