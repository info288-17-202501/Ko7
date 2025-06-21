import React, { useState, useEffect } from "react";
import Card from './Card';
import HexCell from './HexCell';
import { useCardApi } from './API/useCardApi';

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

function GameBoard() {
  // Usamos el hook de la API para obtener las cartas y las funciones
  const { cards, loading, error, fetchCards } = useCardApi();
  
  // Estado local para la interfaz del juego
  const [selectedHex, setSelectedHex] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardPositions, setCardPositions] = useState({});
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
      efectos: selectedCard.efectos || cardInfo?.efectos,
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
    
    // Obtener la información completa de la carta desde el array de cartas
    const fullCardData = cards.find(c => c.id.toString() === cardId.toString());
    
    // Intentar obtener stats desde dataTransfer
    let statsFromDrag = null;
    try {
      const statsData = e.dataTransfer.getData("cardStats");
      if (statsData) {
        statsFromDrag = JSON.parse(statsData);
        console.log("Stats obtenidos desde dataTransfer:", statsFromDrag);
      }
    } catch (error) {
      console.error("Error al parsear las estadísticas desde dataTransfer:", error);
    }
    
    // Usar stats de tres posibles fuentes, en orden de prioridad
    const finalStats = statsFromDrag || fullCardData?.stats || null;
    console.log("handleDrop - Stats finales:", JSON.stringify(finalStats));
    
    setCardPositions(prevPositions => ({
      ...prevPositions,
      [`${q},${r}`]: { 
        id: cardId, 
        type: cardType,
        name: cardName,
        rarity: cardRarity,
        stats: finalStats,
        efectos: fullCardData?.efectos,
        image: fullCardData?.image
      }
    }));
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
      <div style={{ 
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

  return (
    <div style={{ 
      padding: '10px', 
      fontFamily: 'Arial, sans-serif',
      height: '87vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '5px',
        fontSize: '1.5rem'
      }}>
        Tablero Hexagonal con Celdas Adyacentes
      </h1>        {/* Indicador de carta seleccionada - Posición actualizada y z-index aumentado */}
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
      <div 
        style={{ 
          width: '90%',
          maxWidth: '900px',
          height: '100vh',
          position: 'relative',
          margin: '0 auto',
          border: '2px solid #333',
          borderRadius: '10px',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          flex: '1'
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
              key={index}
              q={hex.q}
              r={hex.r}
              onClick={handleHexClick}
              selected={isSelected || hasSelectedCard}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >              {cardData && (
                <Card 
                  id={cardData.id}
                  type={cardData.type}
                  color={cards.find(c => c.id.toString() === cardData.id.toString())?.color || '#666'}
                  name={cardData.name}
                  rarity={cardData.rarity}
                  description={cards.find(c => c.id.toString() === cardData.id.toString())?.description}
                  stats={cardData.stats || cards.find(c => c.id.toString() === cardData.id.toString())?.stats}
                  efectos={cardData.efectos || cards.find(c => c.id.toString() === cardData.id.toString())?.efectos}
                  image={cards.find(c => c.id.toString() === cardData.id.toString())?.image}
                  isSmall={true}
                  inBoard={true}
                />
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
      
      {/* Contenedor de cartas independiente  Ahora posicionado más abajo */}
      <div style={{ 
          width: '90%',
          maxWidth: '900px',
          margin: '10px auto 0',
          height: '100px',
          maxHeight: '300px',
          padding: '20px',
          backgroundColor: 'rgba(245, 245, 245, 0.9)',
          borderRadius: '10px',
          border: '2px solid #ccc',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          position: 'relative',
          zIndex: 1,
          overflowY: 'hidden'
          
        }}>
        <h3 style={{ 
          width: '100%', 
          textAlign: 'center',
          margin: '0 0 5px 0',
          fontSize: '14px',
          color: '#555'
        }}>
          Cartas Disponibles
        </h3>
        {cards.map(card => {
          // Verificamos si la carta ya está en el tablero comparando correctamente los IDs
          // Asegurarse de que ambos sean strings para una comparación correcta
          const isCardOnBoard = Object.values(cardPositions).some(pos => 
            String(pos.id) === String(card.id)
          );
          
          // Debug para ver qué cartas están en el tablero
          if (isCardOnBoard) {
            console.log(`Carta ${card.id} ya está en el tablero`);
          }
          
          // Solo mostramos las cartas que NO están en el tablero
          return !isCardOnBoard && (
            <Card 
              key={card.id} 
              id={card.id} 
              type={card.type} 
              color={card.color}
              name={card.name}
              rarity={card.rarity}
              description={card.description}
              stats={card.stats}
              efectos={card.efectos}
              isSmall={true}
            />
          );
        })}
      </div>
      
      {/* Pie de página con información de la API */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '10px',
        fontSize: '11px',
        color: '#999',
        paddingBottom: '5px'
      }}>
        <p style={{margin: '0'}}>
          Conectado a API - Base de datos PostgreSQL: Card Details DB
          {error && " | Estado: Error de conexión"}
          {loading && " | Estado: Cargando datos..."}
          {!error && !loading && " | Estado: Conectado"}
        </p>
      </div>
      
    </div>
  );
}

export default GameBoard;
