import React from "react";
import ReactDOM from "react-dom";
import './styles/animations.css'; // Asegúrate de que el CSS esté correctamente importado

// Gestión global de qué carta está mostrando su descripción
let activeCardId = null;

const getColorByRarity = (rarity) => {
  switch(rarity) {
    case 'Común': return '#8e9ba9'; // Gris azulado
    case 'Rara': return '#7e57c2'; // Morado
    case 'Épica': return '#ff9800'; // Naranja
    case 'Legendaria': return '#ffd700'; // Dorado
    default: return '#33a8ff'; // Azul por defecto
  }
};

const getRarityClass = (rarity) => {
  switch(rarity) {
    case 'Común': return 'card-rarity-comun';
    case 'Rara': return 'card-rarity-rara';
    case 'Épica': return 'card-rarity-epica';
    case 'Legendaria': return 'card-rarity-legendaria';
    default: return 'card-rarity-comun';
  }
};

const getRarityBorderClass = (rarity) => {
  switch(rarity) {
    case 'Común': return 'offsetBorder';
    case 'Rara': return 'border-rarity-rara';
    case 'Épica': return 'border-rarity-epica';
    case 'Legendaria': return 'border-rarity-legendaria';
    default: return 'border-rarity-comun';
  }
};

class Card extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isHovered: false,
      isDescriptionVisible: false
    };
  }
  componentDidUpdate(prevProps, prevState) {
    // Si cambiamos de estado, suscribirse al evento de activación de otra carta
    if (this.state.isDescriptionVisible && !prevState.isDescriptionVisible) {
      document.addEventListener('card-activated', this.handleCardActivated);
    } else if (!this.state.isDescriptionVisible && prevState.isDescriptionVisible) {
      document.removeEventListener('card-activated', this.handleCardActivated);
    }
  }

  handleClick = (e) => {
    // Vamos a permitir que el clic llegue al hexágono si la carta está en el tablero
    const isInBoard = this.props.isSmall && this.props.inBoard;
    
    if (!isInBoard) {
      // Solo detenemos la propagación para cartas que no están en el tablero
      e.stopPropagation();
    }
    
    // Si esta carta ya estaba activa, desactivamos todas
    if (activeCardId === this.props.id) {
      activeCardId = null;
      this.setState({ isDescriptionVisible: false });
    } else {
      // Activamos esta carta
      activeCardId = this.props.id;
      this.setState({ isDescriptionVisible: true });
      
      // Notificar a todas las demás cartas que deberían ocultarse
      document.dispatchEvent(new CustomEvent('card-activated', { 
        detail: { cardId: this.props.id } 
      }));
    }

    if (this.props.onCardClick) {
      this.props.onCardClick(this.props);
    }
  };

  handleGlobalClick = (e) => {
    // Si se hace clic fuera de esta carta, ocultamos su descripción
    if (this.state.isDescriptionVisible) {
      this.setState({ isDescriptionVisible: false });
    }
  };
    handleCardActivated = (e) => {
    // Si otra carta fue activada, ocultamos nuestra descripción
    if (e.detail.cardId !== this.props.id && this.state.isDescriptionVisible) {
      this.setState({ isDescriptionVisible: false });
    }
  };
  
  handleDragStart = (e) => {
    e.dataTransfer.setData("cardId", this.props.id);
    e.dataTransfer.setData("cardType", this.props.type);
    e.dataTransfer.setData("cardName", this.props.name || "Sin nombre");
    e.dataTransfer.setData("cardRarity", this.props.rarity || "Común");
    
    // También pasamos las estadísticas si están disponibles
    if (this.props.stats) {
      try {
        e.dataTransfer.setData("cardStats", JSON.stringify(this.props.stats));
      } catch (error) {
        console.error("Error al serializar las estadísticas:", error);
      }
    }
  };
  
  componentDidMount() {
    // Al montar el componente, nos suscribimos a los clics globales
    document.addEventListener('click', this.handleGlobalClick);

    // Crear un div para el portal de la descripción si no existe
    if (!this.portalRoot || !document.body.contains(this.portalRoot)) {
      this.portalRoot = document.createElement('div');
      this.portalRoot.className = 'card-description-portal';
      this.portalRoot.style.zIndex = "10000"; // Asegurar que está por encima de todos los elementos
      document.body.appendChild(this.portalRoot);
      console.log("PortalRoot creado correctamente.");
    } else {
      console.log("PortalRoot ya existe.");
    }
  }

  handleMouseEnter = () => {
    this.setState({ isHovered: true });
    // Notificar al componente padre sobre el hover
    if (this.props.onCardHover) {
      this.props.onCardHover(this.props);
    }
  };

  handleMouseLeave = () => {
    this.setState({ isHovered: false });
    // Notificar al componente padre que el hover terminó
    if (this.props.onCardLeave) {
      this.props.onCardLeave();
    }
  };

  componentWillUnmount() {
    // Limpieza al desmontar
    document.removeEventListener('click', this.handleGlobalClick);
    
    // Eliminar el portal si existe
    if (this.portalRoot && document.body.contains(this.portalRoot)) {
      document.body.removeChild(this.portalRoot);
    }  }
  
  renderDescriptionPortal() {
    const { isHovered, isDescriptionVisible } = this.state;

    // Verificar si el portalRoot existe
    if (!this.portalRoot) {
      console.error("El portalRoot no está definido.");
      return null;
    }

    // Verificar si el ratón está encima o si la descripción debe mostrarse
    if (!(isHovered || isDescriptionVisible)) {
      console.log("El portal no se renderiza porque isHovered o isDescriptionVisible son false.");
      return null;
    }

    // Calcular posición para la descripción
    let rect = this.cardRef?.getBoundingClientRect();
    if (!rect) {
      console.error("No se pudo obtener el rect de cardRef.");
      return null;
    }

    const windowHeight = window.innerHeight;
    const spaceAbove = rect.top;
    const tooltipEstimatedHeight = 250; // Altura estimada basada en contenido

    const showBelow = spaceAbove < tooltipEstimatedHeight;
    const topPosition = showBelow 
        ? (rect.bottom + 10) // 10px debajo de la carta
        : (rect.top - 10);   // 10px encima de la carta
    const leftPosition = rect.left + rect.width / 2;

    const transform = showBelow 
        ? 'translateX(-50%)' // Si está abajo, solo centrar horizontalmente
        : 'translateX(-50%) translateY(-100%)'; // Si está arriba, mover hacia arriba

    
    const stats = this.props.stats || {};
    const hasAttack = stats.attack !== undefined;
    const hasHealth = stats.health !== undefined;
    const hasCost = stats.cost !== undefined;
    const hasActions = stats.actions !== undefined;
    
  }

  render() {
    const { isHovered, isDescriptionVisible } = this.state;
    const scale = isHovered ? 1.1 : 1;
    const isSmall = this.props.isSmall;

    const rarity = this.props.rarity || "Común";
    const border = this.props.border || "1px solid #333";
  
    const rarityClass = getRarityClass(rarity);
    const baseColor = getColorByRarity(rarity);
    const borderClass = getRarityBorderClass(rarity);

    return (
      <div style={{ position: 'relative', zIndex: (isHovered || isDescriptionVisible) ? 100 : 1 }}>
        <div
          ref={(el) => this.cardRef = el}
          draggable
          onDragStart={this.handleDragStart}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
          onClick={this.handleClick}
          className={`game-card ${rarityClass} ${borderClass} ${isHovered ? 'offsetBorder2' : 'offsetBorder2'}` }
          style={{
            margin: '3px',
            padding: isSmall ? '4px' : '8px',
            backgroundColor: baseColor,
            borderRadius: '2px',
            cursor: 'grab',
            width: isSmall ? '40px' : '80px',
            height: isSmall ? '60px' : '160px',
            textAlign: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: isSmall ? '8px' : '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.3s ease',
            transform: `scale(${scale})`,
            boxShadow: isHovered ? '0 10px 20px rgba(0,0,0,0.4)' : '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ 
            fontSize: this.props.isSmall ? '16px' : '20px',  // Ajustar tamaño de fuente del ID de la carta
            position: 'relative',
            top: '20%',
            marginBottom: this.props.isSmall ? '2px' : '5px'
          }}>
            {this.props.type || "🃏"}{this.props.id}
          </div>
          <div style={{ 
            fontSize: this.props.isSmall ? '0px' : '0px', // Ajustar tamaño del nombre de la carta
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%'
          }}>
            {this.props.name || "Sin nombre"}
          </div>
          {!this.props.isSmall && (
            <div style={{ 
              fontSize: '10px', 
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: '3px', 
              borderRadius: '3px',
              marginTop: '5px' 
            }}>
              {this.props.rarity || "Común"}
            </div>
          )}
        </div>
        {this.renderDescriptionPortal()}
      </div>
    );
  }
}

export default Card;