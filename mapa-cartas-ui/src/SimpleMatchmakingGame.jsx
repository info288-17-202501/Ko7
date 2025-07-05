import React, { useState, useEffect } from "react";

function SimpleMatchmakingGame({ userData, onBack }) {
  // ID único del componente para debugging
  const [componentId] = useState(() => Math.random().toString(36).substr(2, 9));
  
  // Estados para matchmaking
  const [playerId, setPlayerId] = useState(userData.id);
  const [matchId, setMatchId] = useState(null);
  const [gameSocket, setGameSocket] = useState(null);
  const [gameServerIp, setGameServerIp] = useState(null);
  const [gameServerPort, setGameServerPort] = useState(null);
  const [matchmakingUrl] = useState('http://localhost:9011');
  const [isInQueue, setIsInQueue] = useState(false);
  const [isInGame, setIsInGame] = useState(false);
  const [opponentId, setOpponentId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // Estados adicionales para prevenir duplicados
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasJoinedQueue, setHasJoinedQueue] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [hasShownConnectingMessage, setHasShownConnectingMessage] = useState(false);

  // Función para agregar mensajes
  const addMessage = (content, type = 'system') => {
    const timestamp = new Date().toLocaleTimeString();
    const newMessage = {
      id: Date.now() + Math.random(),
      content: `[${componentId}] ${content}`,
      type,
      timestamp
    };
    console.log(`[${componentId}][${type}] ${content}`); // También log en consola
    setMessages(prev => [...prev, newMessage]);
  };

  // Función para enviar requests al matchmaking
  const sendMatchmakingRequest = async (action, additionalData = {}) => {
    try {
      // Validar que no estemos ya procesando
      if (isProcessing) {
        addMessage(`⚠️ Ya hay una request en proceso, esperando...`, 'system');
        return null;
      }

      if (isInQueue && action === 'joinMatch') {
        addMessage(`⚠️ Ya estás en cola, no se puede enviar otra request`, 'system');
        return null;
      }

      // Debounce: prevenir requests muy rápidas
      const now = Date.now();
      if (now - lastRequestTime < 3000) { // Mínimo 3 segundos entre requests
        addMessage(`⚠️ Esperando antes de enviar otra request (${Math.ceil((3000 - (now - lastRequestTime)) / 1000)}s)`, 'system');
        return null;
      }

      setIsProcessing(true);
      setLastRequestTime(now);

      const requestData = {
        action: action,
        playerId: playerId,
        ...additionalData
      };
      
      console.log('Enviando request:', requestData);
      addMessage(`📤 Enviando: ${action} (Jugador ${playerId})`, 'system');
      
      const response = await fetch(matchmakingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Respuesta recibida:', data);
      addMessage(`📥 Respuesta: ${JSON.stringify(data)}`, 'system');
      
      return data;
    } catch (error) {
      console.error('Error en sendMatchmakingRequest:', error);
      addMessage(`❌ Error de comunicación: ${error.message}`, 'error');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para buscar partida
  const joinMatchmakingQueue = async () => {
    try {
      // Prevenir múltiples requests - VALIDACIÓN ESTRICTA
      if (isInQueue || isInGame || hasJoinedQueue || isProcessing) {
        addMessage(`⚠️ Ya estás en cola, en juego, o procesando una request`, 'system');
        return;
      }

      const userPlayerId = userData.id;
      setPlayerId(userPlayerId);
      
      if (!userPlayerId) {
        addMessage('❌ ID de jugador inválido', 'error');
        return;
      }

      // Marcar como PROCESANDO inmediatamente
      setHasJoinedQueue(true);
      setIsInQueue(true);
      setConnectionStatus('connecting');
      
      // Solo mostrar mensaje de conexión una vez
      if (!hasShownConnectingMessage) {
        addMessage(`🔍 Jugador ${userData.username} (${userPlayerId}) buscando partida...`, 'player');
        setHasShownConnectingMessage(true);
      }
      
      // Unirse al match
      const response = await sendMatchmakingRequest('joinMatch');
      
      if (!response) {
        // Si no hay respuesta, resetear estado
        setIsInQueue(false);
        setHasJoinedQueue(false);
        setConnectionStatus('disconnected');
        return;
      }
      
      if (response.status === 'waiting') {
        setConnectionStatus('waiting');
        addMessage(`⏳ Jugador ${userData.username} en cola de espera`, 'system');
      } else if (response.status === 'matched') {
        handleMatchFound(response);
      } else if (response.status === 'reconnect') {
        // Reconexión a partida existente - ir directo al juego
        addMessage(`🔄 Reconectando a partida existente...`, 'system');
        addMessage(`🎮 Match ID: ${response.matchId}`, 'system');
        addMessage(`🖥️ Servidor: ${response.serverIp}:${response.serverPort}`, 'system');
        
        // Configurar datos de la partida
        setMatchId(response.matchId);
        setGameServerIp(response.serverIp);
        setGameServerPort(response.serverPort);
        setIsInQueue(false);
        setIsInGame(true);
        setConnectionStatus('connected');
        
        // Ir a Game.jsx después de un breve delay
        setTimeout(() => {
          addMessage(`🚀 Redirigiendo al juego...`, 'system');
          // Llamar a onBack con parámetros especiales para ir al juego
          if (onBack) {
            onBack('goToGame', {
              matchId: response.matchId,
              gameServerIp: response.serverIp,
              gameServerPort: response.serverPort,
              reconnect: true
            });
          }
        }, 1000); // Reducido de 1500ms a 1000ms
      } else {
        setIsInQueue(false);
        setHasJoinedQueue(false);
        setConnectionStatus('disconnected');
        addMessage(`❌ Error en matchmaking: ${response.message || 'Error desconocido'}`, 'error');
      }
      
    } catch (error) {
      console.error('Error en joinMatchmakingQueue:', error);
      setIsInQueue(false);
      setHasJoinedQueue(false);
      setConnectionStatus('disconnected');
      addMessage(`❌ Error: ${error.message}`, 'error');
    }
  };

  // Función cuando se encuentra match
  const handleMatchFound = (response) => {
    const matchId = response.matchId;
    const gameServerIp = response.gameServer.ip;
    const gameServerPort = response.gameServer.port;
    
    setMatchId(matchId);
    setGameServerIp(gameServerIp);
    setGameServerPort(gameServerPort);
    
    const opponentInfo = response.players.find(p => p !== playerId);
    setOpponentId(opponentInfo || 'Desconocido');
    
    setIsInQueue(false);
    setIsInGame(true);
    setConnectionStatus('connected');
    
    addMessage(`🎉 ¡Partida encontrada! Match ID: ${matchId}`, 'system');
    addMessage(`🎮 Servidor del juego: ${gameServerIp}:${gameServerPort}`, 'system');
    addMessage(`👥 Jugadores en la partida: ${response.players.join(', ')}`, 'system');
    
    // Ir a Game.jsx después de un breve delay
    setTimeout(() => {
      addMessage(`🚀 Redirigiendo al juego...`, 'system');
      // Llamar a onBack con parámetros especiales para ir al juego
      if (onBack) {
        onBack('goToGame', {
          matchId: matchId,
          gameServerIp: gameServerIp,
          gameServerPort: gameServerPort,
          players: response.players,
          reconnect: false
        });
      }
    }, 1000); // Reducido de 1500ms a 1000ms
  };

  // Función para conectar al game server - REMOVIDO
  // Esta función se removió porque Game.jsx se encargará de conectarse al game server
  // SimpleMatchmakingGame solo es una pantalla intermedia para encontrar partidas

  // Función para salir
  const handleExit = () => {
    console.log("🚪 Saliendo del juego...");
    
    if (gameSocket) {
      gameSocket.close();
      setGameSocket(null);
    }
    
    // Resetear todos los estados de matchmaking
    setIsInGame(false);
    setIsInQueue(false);
    setHasJoinedQueue(false);
    setIsProcessing(false);
    setHasShownConnectingMessage(false);
    setMatchId(null);
    setGameServerIp(null);
    setGameServerPort(null);
    setOpponentId(null);
    setPlayerId(null);
    setConnectionStatus('disconnected');
    
    if (onBack) {
      onBack();
    }
  };

  // useEffect para iniciar automáticamente (CORREGIDO)
  useEffect(() => {
    console.log(`[${componentId}] SimpleMatchmakingGame montado`);
    console.log(`[${componentId}] userData:`, userData);
    
    if (userData && userData.id) {
      addMessage(`🎮 Sistema iniciado para ${userData.username} (ComponentID: ${componentId})`, 'system');
      addMessage(`👤 ID de jugador: ${userData.id}`, 'system');
      addMessage(`🔗 URL Matchmaking: ${matchmakingUrl}`, 'system');
      
      // Verificar si ya está en proceso de conexión
      if (hasJoinedQueue || isInQueue || isInGame) {
        addMessage(`⚠️ Ya hay un proceso de matchmaking activo, saltando auto-inicio`, 'system');
        return;
      }
      
      // SOLO una vez al montar el componente
      let hasStarted = false;
      
      const autoStart = setTimeout(() => {
        if (!hasStarted && !isInQueue && !isInGame && !hasJoinedQueue) {
          hasStarted = true;
          addMessage('🔍 Iniciando búsqueda automática...', 'system');
          joinMatchmakingQueue();
        } else {
          addMessage(`⚠️ No se puede auto-iniciar: hasStarted=${hasStarted}, isInQueue=${isInQueue}, isInGame=${isInGame}, hasJoinedQueue=${hasJoinedQueue}`, 'system');
        }
      }, 2000);

      // Cleanup function
      return () => {
        console.log(`[${componentId}] Cleanup ejecutado`);
        clearTimeout(autoStart);
        hasStarted = true; // Prevenir ejecución si se desmonta
      };
    } else {
      addMessage('❌ No se recibió userData válido', 'error');
      console.error(`[${componentId}] userData inválido:`, userData);
    }
  }, []); // Dependencias vacías para que se ejecute SOLO una vez

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1a1a2e',
      color: 'white',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Botón de salir */}
      <button 
        onClick={handleExit}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        ← Salir
      </button>

      {/* Información del usuario */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '8px',
        zIndex: 1000
      }}>
        <h3>👤 Información del Jugador</h3>
        <p><strong>Nombre:</strong> {userData?.username || 'No disponible'}</p>
        <p><strong>ID:</strong> {userData?.id || 'No disponible'}</p>
        <p><strong>Estado:</strong> 
          <span style={{
            color: connectionStatus === 'connected' ? '#28a745' : 
                   connectionStatus === 'waiting' ? '#ffc107' : 
                   connectionStatus === 'connecting' ? '#17a2b8' : '#dc3545',
            marginLeft: '10px'
          }}>
            {connectionStatus === 'connected' && '🟢 En Partida'}
            {connectionStatus === 'waiting' && '🟡 En Cola'}
            {connectionStatus === 'connecting' && '🔵 Conectando...'}
            {connectionStatus === 'disconnected' && '🔴 Desconectado'}
          </span>
        </p>
        {matchId && <p><strong>Match ID:</strong> {matchId}</p>}
        {opponentId && <p><strong>Oponente:</strong> {opponentId}</p>}
      </div>

      {/* Área de mensajes */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '15px',
        borderRadius: '8px',
        height: '300px',
        overflow: 'hidden'
      }}>
        <h3>📨 Log de Matchmaking</h3>
        <div style={{
          height: '250px',
          overflowY: 'auto',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {messages.map((message) => (
            <div key={message.id} style={{
              marginBottom: '5px',
              color: message.type === 'error' ? '#ff6b6b' : 
                     message.type === 'player' ? '#51cf66' : 
                     message.type === 'opponent' ? '#ff8cc8' : '#c9c9c9'
            }}>
              <span style={{ color: '#888' }}>
                [{message.timestamp}]
              </span>{' '}
              {message.content}
            </div>
          ))}
        </div>
      </div>

      {/* Botones de control */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <h1>🎮 Sistema de Matchmaking - DEBUG</h1>
        <div style={{ marginTop: '20px' }}>
          {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
            <button 
              onClick={joinMatchmakingQueue}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                margin: '0 10px'
              }}
            >
              🔍 Buscar Partida
            </button>
          )}
          {connectionStatus === 'waiting' && (
            <button 
              onClick={() => {
                setIsInQueue(false);
                setHasJoinedQueue(false);
                setIsProcessing(false);
                setHasShownConnectingMessage(false);
                setConnectionStatus('disconnected');
                addMessage('❌ Búsqueda cancelada por el usuario', 'system');
              }}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                margin: '0 10px'
              }}
            >
              ❌ Cancelar Búsqueda
            </button>
          )}
          {connectionStatus === 'connecting' && (
            <div style={{ color: '#17a2b8', fontSize: '18px' }}>
              🔵 Conectando al matchmaking...
            </div>
          )}
          {connectionStatus === 'connected' && (
            <div style={{ color: '#4caf50', fontSize: '18px' }}>
              🎉 ¡Redirigiendo al juego!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimpleMatchmakingGame;
