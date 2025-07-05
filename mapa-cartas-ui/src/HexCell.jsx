import React from 'react';
import './styles/animations.css'; // Asegúrate de que el CSS esté correctamente importado

// Tamaño del hexágono (importado de las constantes)
export const HEX_SIZE =40; // Reducido para mejor ajuste
export const HEX_WIDTH = HEX_SIZE * 2;
export const HEX_HEIGHT = HEX_SIZE * Math.sqrt(3);

// Función para generar los puntos del hexágono
export function generateHexPoints(size) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const px = size * Math.cos(angle);
    const py = size * Math.sin(angle);
    points.push(`${px},${py}`);
  }
  // Asegurarnos de cerrar el polígono correctamente
  points.push(points[0]);
  return points;
}

class HexCell extends React.Component {
  render() {
    const { q, r, onClick, selected, onDrop, onDragOver, children } = this.props;
    
    // Convertir coordenadas axiales a píxeles correctamente
    const x = HEX_SIZE * 1.5 * q;
    const y = HEX_SIZE * Math.sqrt(3) * (r + q * 0.5);      // Ajustar el centrado para acomodar todas las celdas
    const centerX = 400;  // Centro horizontal del mapa (ajustado)
    const centerY = 180;  // Centrado vertical del mapa (ajustado)
    
    // Crear el path del hexágono con todos los bordes visibles
    const points = generateHexPoints(HEX_SIZE);
    
    return (
      <div
        className={`hex-cell ${selected ? "hex-selected" : ""}`}
        style={{
          position: 'absolute',
          left: `${x + centerX}px`,  // Centrar en X
          top: `${y + centerY}px`,   // Centrar en Y
          width: `${HEX_WIDTH}px`,
          height: `${HEX_HEIGHT}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: selected ? 10 : 1,
        }}
        onClick={() => onClick(q, r)}
        onDrop={(e) => onDrop(e, q, r)}
        onDragOver={onDragOver}
      >
        <svg 
          width={HEX_WIDTH} 
          height={HEX_HEIGHT}
          style={{ position: 'absolute', top: 0, left: 0, bottom:0, right: 0, overflow: 'visible' }}
        >
        <defs>
          <linearGradient id="hex-hover-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e3f2fd" />
            <stop offset="100%" stopColor="#bbdefb" />
          </linearGradient>
        </defs>
          <polygon
            points={points.join(' ')}
            className={selected ? "hex-polygon-selected" : "hex-polygon"}
         
            strokeWidth="3"
            transform={`translate(${HEX_SIZE}, ${HEX_SIZE})`}
          />
        </svg>
        <div className="hex-inner" style={{ zIndex: 10, position: 'relative' }}>
          {children}
        </div>
      </div>
    );
  }
}


export default HexCell;