import React, { useState, useEffect } from "react";
import './styles/animations.css';
import './styles/background.css';
import './styles/screen.css';
import './styles/buttons.css';
import './styles/server-list.css';

const Menu = ({ onBackToMain }) => {
    const [servers, setServers] = useState([]);
    const [selectedServer, setSelectedServer] = useState(null);

    // Función para obtener la lista de servidores (implementar cuando haya backend)
    const fetchServers = async () => {
        // Simulando servidores para el diseño
        const mockServers = [
        { id: 1, name: "Servidor Principal", players: 45, maxPlayers: 100, ping: 25, status: "online" },
        { id: 2, name: "Servidor Europa", players: 32, maxPlayers: 80, ping: 78, status: "online" },
        { id: 3, name: "Servidor América", players: 67, maxPlayers: 120, ping: 45, status: "online" },
        { id: 4, name: "Servidor Asia", players: 23, maxPlayers: 60, ping: 120, status: "maintenance" },
        { id: 5, name: "Servidor Beta", players: 12, maxPlayers: 50, ping: 15, status: "online" },
        { id: 6, name: "Servidor Test", players: 5, maxPlayers: 30, ping: 8, status: "online" },
        { id: 7, name: "Servidor Test", players: 4, maxPlayers: 30, ping: 8, status: "online" },
        { id: 8, name: "Servidor Test", players: 14, maxPlayers: 30, ping: 8, status: "online" },
        ];
        
        setServers(mockServers);
    };

    useEffect(() => {
        fetchServers();
    }, []);

    const handleServerSelect = (server) => {
        setSelectedServer(server);
    };

    const handleJoinServer = () => {
        if (selectedServer) {
        console.log(`Conectando al servidor: ${selectedServer.name}`);
        // Aquí implementarás la lógica de conexión al servidor
        }
    };

    return (
        <div className="menu-container fade-in">
            <div className="server-list-panel slide-up">
                    {onBackToMain && (
                        <button 
                        className="back-button cybr-btn danger small"
                        onClick={onBackToMain}
                        >
                        ← Volver<span aria-hidden></span>
                        <span aria-hidden className="cybr-btn__glitch">Back</span>
                        <span aria-hidden className="cybr-btn__tag custom">ESC</span>
                        </button>
                    )}

                    <div className="scanlines"></div>
                    <h2 className="rgb-text-effect" style={{ 
                        textAlign: 'center', 
                        marginBottom: '3%',
                        fontSize: '1.5rem',
                        }}>
                        {'Lista de Servidores'.split('').map((char, index) => (
                        <span 
                            key={index} 
                            className="char" 
                            style={{'--char-index': index}}
                        >
                            {char}
                        </span>
                        ))}
                    </h2> 
                
                <div className="server-list-container">
                <div className="server-list-scroll">
                    {servers.map((server) => (
                    <div
                        key={server.id}
                        className={`server-item ${selectedServer?.id === server.id ? 'selected' : ''} ${server.status === 'maintenance' ? 'maintenance' : ''}`}
                        onClick={() => handleServerSelect(server)}
                    >
                        <div className="server-main-info">
                        <span className="server-name">{server.name}</span>
                        <span className={`server-status ${server.status}`}>
                            {server.status === 'online' ? '🟢' : '🔧'}
                        </span>
                        </div>
                        
                        <div className="server-details">
                        <span className="server-players">
                            👥 {server.players}/{server.maxPlayers}
                        </span>
                        <span className="server-ping">
                            📡 {server.ping}ms
                        </span>
                        </div>
                    </div>
                    ))}
                </div>
                </div>

                <div className="server-actions">
                <button 
                    className="cybr-btn join-server aggressive-shape intense-hover"  
                    onClick={handleJoinServer}
                    disabled={!selectedServer || selectedServer?.status === 'maintenance'}
                >
                    Unirse<span aria-hidden></span>
                    <span aria-hidden class="cybr-btn__glitch">Unirse al servidor</span>
                    <span aria-hidden class="cybr-btn__tag custom">Ko7</span>
                </button>
                <button className="cybr-btn refresh-server aggressive-shape intense-hover" onClick={fetchServers}>
                    Actualizar<span aria-hidden></span>
                    <span aria-hidden class="cybr-btn__glitch">Actualizar Lista</span>
                    <span aria-hidden class="cybr-btn__tag custom">Ko7</span>
                </button>
                </div>
            </div>
        </div>
    );
};

export default Menu;