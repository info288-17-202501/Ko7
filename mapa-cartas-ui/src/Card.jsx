import React from "react";
import ReactDOM from "react-dom";

// Gestión global de qué carta está mostrando su descripción
let activeCardId = null;

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
  handleMouseEnter = () => {
    // Al pasar el ratón sobre la carta, la marcamos como hover y mostramos su descripción si tiene una
    this.setState({ isHovered: true });
  };

  handleMouseLeave = () => {
    this.setState({ isHovered: false });
  };

  handleClick = (e) => {
    // Al hacer clic en la carta, mostramos su descripción
    e.stopPropagation(); // Evitamos que el clic llegue al documento
    
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
  };  componentDidUpdate(prevProps, prevState) {
    // Si cambiamos de estado, suscribirse al evento de activación de otra carta
    if (this.state.isDescriptionVisible && !prevState.isDescriptionVisible) {
      document.addEventListener('card-activated', this.handleCardActivated);
    } else if (!this.state.isDescriptionVisible && prevState.isDescriptionVisible) {
      document.removeEventListener('card-activated', this.handleCardActivated);
    }
  }  componentDidMount() {
    // Al montar el componente, nos suscribimos a los clics globales
    document.addEventListener('click', this.handleGlobalClick);
    
    // Crear un div para el portal de la descripción si no existe
    if (!this.portalRoot) {
      this.portalRoot = document.createElement('div');
      this.portalRoot.className = 'card-description-portal';
      this.portalRoot.style.zIndex = "10000"; // Asegurar que está por encima de todos los elementos
      document.body.appendChild(this.portalRoot);
    }
  }

  componentWillUnmount() {
    // Limpieza al desmontar
    document.removeEventListener('click', this.handleGlobalClick);
    
    // Eliminar el portal si existe
    if (this.portalRoot && document.body.contains(this.portalRoot)) {
      document.body.removeChild(this.portalRoot);
    }
  }
  renderDescriptionPortal() {
    const { isHovered, isDescriptionVisible } = this.state;
    const isSmall = this.props.isSmall;
    
    if (!this.portalRoot || !(isHovered || isDescriptionVisible) || !this.props.description) {
      return null;
    }
    
    // Calcular posición para la descripción
    let rect = this.cardRef?.getBoundingClientRect();
    if (!rect) return null;
    
    // Posición centrada sobre la carta
    const topPosition = rect.top - 10; // 10px por encima de la carta
    const leftPosition = rect.left + rect.width / 2;
      return ReactDOM.createPortal(
      <span 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: `${topPosition}px`,
          left: `${leftPosition}px`,
          transform: 'translateX(-50%) translateY(-100%)',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          width: '250px',
          maxHeight: '300px',
          fontSize: '15px',
          zIndex: 10000,
          boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
          textAlign: 'left',
          pointerEvents: 'auto',
          overflowY: 'auto',
          lineHeight: '1.4',
          display: 'block',
          opacity: 1,
          visibility: 'visible'
        }}
      >
        <span style={{ 
          fontWeight: 'bold', 
          marginBottom: '8px',
          fontSize: '16px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          paddingBottom: '6px',
          display: 'block'
        }}>
          {this.props.name}
        </span>
        <span style={{ 
          fontSize: '16px', 
          color: '#aaa', 
          marginBottom: '10px',
          textAlign: 'center',
          display: 'block'
        }}>
          {this.props.rarity}
        </span>
        <span style={{ 
          textAlign: 'justify',
          display: 'block'
        }}>
          {this.props.description}
        </span>
      </span>,
      this.portalRoot
    );
  }

  render() {
    const { isHovered, isDescriptionVisible } = this.state;
    const scale = isHovered ? 1.1 : 1;
    const isSmall = this.props.isSmall;
    
    return (
      <div style={{ position: 'relative', zIndex: (isHovered || isDescriptionVisible) ? 100 : 1 }}>
        <div
          ref={(el) => this.cardRef = el}
          draggable
          onDragStart={this.handleDragStart}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
          onClick={this.handleClick}
          style={{
            margin: '3px',
            padding: isSmall ? '5px' : '10px',
            backgroundColor: this.props.color,
            border: '2px solid #333',
            borderRadius: '8px',
            cursor: 'grab',
            width: isSmall ? '80px' : '120px',
            height: isSmall ? '60px' : '160px',
            textAlign: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: isSmall ? '12px' : '14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.3s ease',
            transform: `scale(${scale})`,
            boxShadow: isHovered ? '0 10px 20px rgba(0,0,0,0.4)' : '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ 
            fontSize: this.props.isSmall ? '14px' : '16px',  // Ajustar tamaño de fuente del ID de la carta
            marginBottom: this.props.isSmall ? '2px' : '5px'
          }}>
            {this.props.type || "🃏"}{this.props.id}
          </div>
          <div style={{ 
            fontSize: this.props.isSmall ? '9px' : '12px', // Ajustar tamaño del nombre de la carta
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