import React from "react";
import Card from './Card';
import HexCell from './HexCell';


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

class GameBoard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedHex: null,
      selectedCard: null,
      cardPositions: {},
      cards: [
        { 
          id: 1, 
          type: "P", 
          color: "#FF5733", 
          name: "Dragón Carmesí", 
          rarity: "Personaje",
          description: "Un poderoso dragón de escamas rojas que puede lanzar bolas de fuego a sus enemigos. Gana +2 de ataque contra unidades voladoras."
        },
        { 
          id: 2, 
          type: "O", 
          color: "#33FF57", 
          name: "Elixir de Vida", 
          rarity: "Hechizo",
          description: "Restaura 5 puntos de vida a un personaje aliado y le otorga inmunidad al veneno durante 2 turnos."
        },
        { 
          id: 3, 
          type: "P", 
          color: "#3357FF", 
          name: "Caballero Celeste", 
          rarity: "Personaje",
          description: "Guerrero noble montado que empuña una lanza sagrada. Puede realizar un ataque adicional si derrota a un enemigo en su turno."
        },
        { 
          id: 4, 
          type: "A", 
          color: "#F033FF", 
          name: "Hada Luminosa", 
          rarity: "Aliado",
          description: "Una pequeña hada que emite luz curativa. Cada turno restaura 1 punto de vida a todos los aliados adyacentes."
        },
        { 
          id: 5, 
          type: "H", 
          color: "#FF33F0", 
          name: "Tormenta Arcana", 
          rarity: "Hechizo",
          description: "Invoca una poderosa tormenta mágica que inflige 3 puntos de daño a todas las unidades enemigas en un radio de 2 celdas."
        },
        { 
          id: 6, 
          type: "A", 
          color: "#33FFF0", 
          name: "Lobo Guardián", 
          rarity: "Aliado",
          description: "Un feroz lobo adiestrado para proteger a su compañero. Puede interceptar ataques dirigidos a personajes aliados adyacentes."
        }
      ]
    };
  }

  handleHexClick = (q, r) => {
    const hexKey = `${q},${r}`;
    const cardHere = this.state.cardPositions[hexKey];
    
    // Imprimir la celda seleccionada en la consola
    console.log(`Celda seleccionada: (q: ${q}, r: ${r})`);

    if (this.state.selectedCard) {
      // Si ya hay una carta seleccionada, moverla aquí
      this.moveSelectedCardTo(q, r);
    } else if (cardHere) {
      // Si no hay carta seleccionada pero esta celda tiene una, seleccionarla
      this.setState({
        selectedCard: {
          id: cardHere.id,
          type: cardHere.type,
          name: cardHere.name,
          rarity: cardHere.rarity,
          originalPosition: { q, r }
        }
      });
    } else {
      // Si es una celda vacía, solo seleccionar la celda
      this.setState({ selectedHex: { q, r } });
    }
  };

  moveSelectedCardTo = (q, r) => {
    const { selectedCard, cardPositions } = this.state;
    const newPositionKey = `${q},${r}`;
    const originalPositionKey = `${selectedCard.originalPosition.q},${selectedCard.originalPosition.r}`;
    
    // Crear nuevo objeto de posiciones sin la posición original
    const newCardPositions = { ...cardPositions };
    delete newCardPositions[originalPositionKey];
    
    // Agregar la carta en la nueva posición
    this.setState({
      cardPositions: {
        ...newCardPositions,
        [newPositionKey]: {
          id: selectedCard.id,
          type: selectedCard.type,
          name: selectedCard.name,
          rarity: selectedCard.rarity
        }
      },
      selectedCard: null,
      selectedHex: null
    });
  };

  handleDrop = (e, q, r) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("cardId");
    const cardType = e.dataTransfer.getData("cardType");
    
    if (cardId) {
      const cardName = e.dataTransfer.getData("cardName");
      const cardRarity = e.dataTransfer.getData("cardRarity");
      
      this.setState(prevState => ({
        cardPositions: {
          ...prevState.cardPositions,
          [`${q},${r}`]: { 
            id: cardId, 
            type: cardType,
            name: cardName,
            rarity: cardRarity
          }
        }
      }));
    }
  };

  handleDragOver = (e) => {
    e.preventDefault();
  };

  cancelSelection = () => {
    this.setState({ selectedCard: null });
  };

  render() {
    const { selectedHex, selectedCard, cardPositions, cards } = this.state;

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
        </h1>
        
        {/* Indicador de carta seleccionada - Ahora posicionado de manera absoluta */}
        {selectedCard && (
          <div style={{ 
            position: 'absolute',
            bottom: '10px',
            top: '77.5%',
            height: '25px',
            width: '300px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center', 
            padding: '5px 10px',
            backgroundColor: 'rgba(227, 242, 253, 0.9)',
            borderRadius: '8px',
            border: '1px solid #2196f3',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            <span>Carta seleccionada: {selectedCard.type}{selectedCard.id}</span>
            <button 
              onClick={this.cancelSelection}
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
                onClick={this.handleHexClick}
                selected={isSelected || hasSelectedCard}
                onDrop={this.handleDrop}
                onDragOver={this.handleDragOver}
              >
                {cardData && (
                  <div 
                    style={{ 
                      backgroundColor: cards.find(c => c.id.toString() === cardData.id)?.color || '#666',
                      color: 'white',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      border: hasSelectedCard ? '2px solid #ffeb3b' : '1px solid #333',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '50px'
                    }}
                  >
                    <div>{cardData.type || "🃏"}{cardData.id}</div>
                    <div style={{ fontSize: '10px', marginTop: '1px' }}>{cardData.name}</div>
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
        
        {/* Contenedor de cartas independiente - Ahora posicionado más abajo */}
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
          {cards.map(card => 
            !Object.values(cardPositions).some(pos => 
              pos.id === card.id.toString()
            ) && (
              <Card 
                key={card.id} 
                id={card.id} 
                type={card.type} 
                color={card.color}
                name={card.name}
                rarity={card.rarity}
                description={card.description}
                isSmall={true}
              />
            )
          )}
        </div>
        
        
      </div>
      
    );
    
  }
  
}

export default GameBoard;