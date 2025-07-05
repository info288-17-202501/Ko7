import React, { useState, useEffect } from 'react';
import Menu from './menu.jsx';
import DeckCreator from './DeckCreator.jsx';
import Game from './Game.jsx';
import SimpleMatchmakingGame from './SimpleMatchmakingGame.jsx';
import './styles/animations.css';
import './styles/background.css';
import './styles/screen.css';
import './styles/server-list.css';

const MainMenu = ({ userData, onLogout }) => {
    const [currentScreen, setCurrentScreen] = useState('main'); // 'main', 'servers', 'matches', 'game'
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [gameData, setGameData] = useState(null); // Para pasar datos del match al juego
    

    const handleScreenTransition = (newScreen) => {
        setIsTransitioning(true);
        
        setTimeout(() => {
            setCurrentScreen(newScreen);
            setIsTransitioning(false);
        }, 300); 
    };


    const handleBackToMain = (action, data) => {
        if (action === 'goToGame' && data) {
            // Redirigir al juego con los datos del match
            console.log("🎮 Redirigiendo al juego con datos:", data);
            setGameData(data);
            handleScreenTransition('game-direct');
        } else {
            // Volver al menú principal normal
            setGameData(null);
            handleScreenTransition('main');
        }
    };

    const handleLogout = () => {
        if (onLogout) {
        onLogout();
        }
    };

     // ← FUNCIÓN ESPECÍFICA PARA IR AL JUEGO
    const handlePlayGame = () => {
        console.log("🎮 Iniciando matchmaking y juego...");
        console.log("👤 Jugador ID:", userData.id);
        handleScreenTransition('game');
    };

    // ← AGREGAR CONDICIÓN PARA EL JUEGO (temporal: usar Game directo para testing)
    //if (currentScreen === 'game') {
    //    return (
    //        <div className={`transition-container ${isTransitioning ? 'transitioning-out' : 'transitioning-in'}`}>
    //            <Game userData={userData} onBack={handleBackToMain} />
    //        </div>
    //    );
    //}

    // ← AGREGAR CONDICIÓN PARA EL JUEGO DIRECTO (cuando ya hay match)
    if (currentScreen === 'game-direct') {
        return (
            <div className={`transition-container ${isTransitioning ? 'transitioning-out' : 'transitioning-in'}`}>
                <Game userData={userData} gameData={gameData} onBack={handleBackToMain} />
            </div>
        );
    }

    // ← CONDICIÓN PARA MATCHMAKING (pantalla intermedia antes del juego)
    if (currentScreen === 'game') {
        return (
            <div className={`transition-container ${isTransitioning ? 'transitioning-out' : 'transitioning-in'}`}>
                <SimpleMatchmakingGame userData={userData} onBack={handleBackToMain} />
            </div>
        );
    }

    if (currentScreen === 'deck-creator') {
        return (
            <div className={`transition-container ${isTransitioning ? 'transitioning-out' : 'transitioning-in'}`}>
                <DeckCreator userData={userData} onBack={handleBackToMain} />
            </div>
        );
    }

    if (currentScreen === 'servers') {
        return (
        <div className={`transition-container ${isTransitioning ? 'transitioning-out' : 'transitioning-in'}`}>
            <Menu onBackToMain={handleBackToMain} />
        </div>
        );
    }



    return (
        <div className={`main-menu-container ${isTransitioning ? 'transitioning-out' : 'fade-in'}`}>
        {/* Usuario en esquina superior izquierda */}
        <div className="user-info-container">
            <div className="user-info">
                <div className="user-avatar">👤</div>
                    <div className="user-details">
                        <span className="user-name rgb-text-effect">{userData.username}</span>
                        <span className="user-status">En línea</span>
                    
                    </div>
                    
                        {/* Botón de logout que aparece en hover */}
                        <div className="logout-button-container">
                            <button 
                                className="cybr-btn danger small logout-btn"
                                onClick={handleLogout}
                                title="Cerrar Sesión"
                                >
                                Salir<span aria-hidden></span>
                                <span aria-hidden className="cybr-btn__glitch">Logout</span>
                                <span aria-hidden className="cybr-btn__tag custom">ESC</span>
                            </button>
                        </div>
            </div>
            
            {/* Indicador de hover */}
            <div className="hover-indicator">
                <span className="hover-text">Hover para opciones</span>
            </div>
        </div>

        {/* Título principal */}
        <div className="main-title-container">
            <h1 className="main-title rgb-text-effect slide-up">
            {"HeXacrilleage".split('').map((char, index) => (
                <span 
                key={index} 
                className="char" 
                style={{'--char-index': index}}
                >
                {char}
                </span>
            ))}
            </h1>
            <div className="title-underline"></div>
        </div>

        {/* Menú principal */}
        <div className="main-menu-buttons slide-up">
            <button 
                className="cybr-btn join-server aggressive-shape intense-hover"
                onClick={handlePlayGame}
                >
                Jugar<span aria-hidden></span>
                <span aria-hidden className="cybr-btn__glitch">Play</span>
                <span aria-hidden className="cybr-btn__tag custom">Ko7</span>
            </button>

            <button 
                    className="cybr-btn special aggressive-shape intense-hover"
                    onClick={() => handleScreenTransition('deck-creator')}
                >
                    Baraja<span aria-hidden></span>
                    <span aria-hidden className="cybr-btn__glitch">Deck Builder</span>
                    <span aria-hidden className="cybr-btn__tag custom">Ko7</span>
            </button>

            <button 
                className="cybr-btn refresh-server aggressive-shape intense-hover"
                onClick={() => handleScreenTransition('servers')}
                >
                Servidores<span aria-hidden></span>
                <span aria-hidden className="cybr-btn__glitch">Servers</span>
                <span aria-hidden className="cybr-btn__tag custom">Ko7</span>
            </button>

            {/*<button className="cybr-btn special aggressive-shape">
            Configuración<span aria-hidden></span>
            <span aria-hidden className="cybr-btn__glitch">Settings</span>
            <span aria-hidden className="cybr-btn__tag custom">Ko7</span>
            </button>*/}
        </div>

        {/* Elementos decorativos */}
        <div className="cyber-grid"></div>
        <div className="scanlines"></div>
        </div>
    );
};

export default MainMenu;