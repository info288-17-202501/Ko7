import React, { useState, useEffect } from 'react';
import './styles/animations.css';
import './styles/background.css';
import './styles/server-list.css';

const DeckCreator = ({ userData, onBack }) => {
    // Estados para el manejo de datos
    const [allCards, setAllCards] = useState([]);
    const [filteredCards, setFilteredCards] = useState([]);
    const [deck1Cards, setDeck1Cards] = useState([]);
    const [deck2Cards, setDeck2Cards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    
    // Estados para nombres de decks
    const [deck1Name, setDeck1Name] = useState('Combat Deck');
    const [deck2Name, setDeck2Name] = useState('Spell Deck');
    
    // Estados para mostrar JSON generado
    const [generatedJSON, setGeneratedJSON] = useState(null);
    const [showJSON, setShowJSON] = useState(false);

    // Cargar cartas al montar el componente
    useEffect(() => {
        cargarTodasLasCartas();
    }, []);

    // Función para cargar todas las cartas desde la API
    const cargarTodasLasCartas = async () => {
        try {
            setLoading(true);
            console.log('Solicitando todas las cartas...');
            const response = await fetch('http://localhost:3030/api/cards');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Datos recibidos:', data);
            
            const formattedCards = data.map(card => ({
                id: card.id,
                name: card.name || 'Sin Nombre',
                description: card.description || 'Sin Descripción',
                type: card.type,
                cost: card.cost || 0,
                attack: card.attack || 0,
                health: card.health || 0,
                rarity: card.rarity || 'Common',
                image: card.image || null,
                color: card.color || getColorByRarity(card.rarity),
                effects: card.effects || [],
                arrows: card.arrows || [],
            }));
            
            setAllCards(formattedCards);
            setFilteredCards(formattedCards);
            setError(null);
        } catch (error) {
            console.error('Error al cargar las cartas:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener color basado en rareza
    const getColorByRarity = (rarity) => {
        switch (rarity) {
            case 'Comun': return '#8e9ba9';
            case 'Rara': return '#4fc3f7';
            case 'Epica': return '#7e57c2';
            case 'Legendaria': return '#ffd700';
            default: return '#33a8ff';
        }
    };

    // Función para filtrar cartas
    const filtrarCartas = (searchValue = searchTerm, typeValue = filterType) => {
        const filtered = allCards.filter(card => {
            const matchesSearch = card.name.toLowerCase().includes(searchValue.toLowerCase()) || 
                                (card.description && card.description.toLowerCase().includes(searchValue.toLowerCase()));
            const matchesType = typeValue ? card.type === typeValue : true;
            return matchesSearch && matchesType;
        });
        
        setFilteredCards(filtered);
    };

    // Manejar cambio en búsqueda
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        filtrarCartas(value, filterType);
    };

    // Manejar cambio en filtro de tipo
    const handleTypeFilterChange = (e) => {
        const value = e.target.value;
        setFilterType(value);
        filtrarCartas(searchTerm, value);
    };

    // Agregar carta a deck
    const agregarCartaABaraja = (deckNumber, cardId) => {
        const cardToAdd = allCards.find(c => c.id === cardId);
        if (!cardToAdd) {
            console.error('Card not found with ID:', cardId);
            return;
        }
        
        // Añadir identificador único
        const cardWithInstanceId = {
            ...cardToAdd,
            instanceId: Date.now() + Math.floor(Math.random() * 1000)
        };
        
        if (deckNumber === 1) {
            setDeck1Cards(prev => [...prev, cardWithInstanceId]);
        } else {
            setDeck2Cards(prev => [...prev, cardWithInstanceId]);
        }
    };

    // Quitar carta de deck
    const quitarCartaBaraja = (deckNumber, instanceId) => {
        if (deckNumber === 1) {
            setDeck1Cards(prev => prev.filter(card => card.instanceId !== instanceId));
        } else {
            setDeck2Cards(prev => prev.filter(card => card.instanceId !== instanceId));
        }
    };

    // Limpiar deck
    const limpiarBaraja = (deckNumber) => {
        const confirmMessage = `¿Estás seguro de querer eliminar todas las cartas del mazo ${deckNumber}?`;
        if (window.confirm(confirmMessage)) {
            if (deckNumber === 1) {
                setDeck1Cards([]);
            } else {
                setDeck2Cards([]);
            }
        }
    };

    // Generar formato JSON
    const generateDeckFormat = () => {
        const formatDeckCards = (cards) => {
            return cards.map(card => {
                const effects = card.effects && card.effects.length > 0 
                    ? card.effects.map(effect => ({
                        id: effect.id || effect.effectId,
                        name: effect.name || 'Sin nombre',
                        description: effect.description || 'Sin descripción',
                        amount: effect.amount || 1,
                        target: effect.target || null,
                        duration: effect.duration || null,
                        repeatable: effect.repeatable || false,
                        trigger: effect.trigger || null
                    }))
                    : [];
                
                const arrows = card.arrows || [];
                
                return {
                    id: card.id,
                    type: card.type,
                    name: card.name || 'Unnamed',
                    rarity: card.rarity || 'Common',
                    attack: card.attack,
                    health: card.health,
                    cost: card.cost,
                    actions: null,
                    effects: effects,
                    arrows: arrows,
                };
            });
        };
        
        const formatoPartida = {
            decks: [
                {
                    name: deck1Name,
                    cards: formatDeckCards(deck1Cards)
                },
                {
                    name: deck2Name,
                    cards: formatDeckCards(deck2Cards)
                }
            ]
        };
        
        setGeneratedJSON(formatoPartida);
        setShowJSON(true);
        
        console.log('Formato JSON para partida:');
        console.log(JSON.stringify(formatoPartida, null, 2));
    };

    // Renderizar carta en catálogo
    const renderCatalogCard = (card) => (
        <div
            key={card.id}
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '10px',
                margin: '5px 0',
                borderRadius: '3px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: `4px solid ${card.color}`,
                color: '#000'
            }}
        >
            <div>
                <strong>{card.name}</strong> [{card.type}]
                <br />
                <small>{card.rarity} - Cost: {card.cost}</small>
                {card.type === 'unit' && (
                    <><br /><small>Attack: {card.attack} | HP: {card.health}</small></>
                )}
            </div>
            <div>
                <button
                    onClick={() => agregarCartaABaraja(1, card.id)}
                    style={{
                        backgroundColor: '#4CAF50',
                        border: 'none',
                        color: 'white',
                        padding: '5px 10px',
                        marginRight: '5px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    + Deck 1
                </button>
                <button
                    onClick={() => agregarCartaABaraja(2, card.id)}
                    style={{
                        backgroundColor: '#2196F3',
                        border: 'none',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    + Deck 2
                </button>
            </div>
        </div>
    );

    // Renderizar carta en deck
    const renderDeckCard = (card, deckNumber) => (
        <div
            key={card.instanceId}
            style={{
                backgroundColor: '#f5f5f5',
                padding: '10px',
                margin: '5px 0',
                borderRadius: '3px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: `4px solid ${card.color}`,
                color: '#000'
            }}
        >
            <div>
                <strong>{card.name}</strong> ({card.type})
                <br />
                <small>ID: {card.id} - {card.rarity} - Cost: {card.cost}</small>
                {card.type === 'unit' && (
                    <><br /><small>ATK: {card.attack} / HP: {card.health}</small></>
                )}
                {card.effects && card.effects.length > 0 && (
                    <><br /><small>Effects: {card.effects.length}</small></>
                )}
            </div>
            <button
                onClick={() => quitarCartaBaraja(deckNumber, card.instanceId)}
                style={{
                    backgroundColor: '#f44336',
                    border: 'none',
                    color: 'white',
                    padding: '2px 8px',
                    height: '30px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                ✖
            </button>
        </div>
    );

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: 'rgba(21, 10, 31, 0.9)',
                color: 'white',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'Arial, sans-serif'
            }}>
                <h2>Cargando cartas...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: 'rgba(21, 10, 31, 0.9)',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'Arial, sans-serif'
            }}>
                <h2>Error al cargar cartas</h2>
                <p>{error}</p>
                <button 
                    onClick={cargarTodasLasCartas}
                    className="cybr-btn refresh-server"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'rgba(21, 10, 31, 0.9)',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            padding: '20px',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            <div className="scanlines"></div>
            
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <div>
                    <h1 className="rgb-text-effect" style={{ margin: 0 }}>
                        Deck Creator
                    </h1>
                    <p className="rgb-text-effect" style={{ margin: '5px 0', color: "rgba(255, 218, 51, 0.8)" }}>
                        Bienvenido {userData?.username}! Crea tu baraja perfecta
                    </p>
                </div>
                
                <button 
                    onClick={onBack}
                    className="cybr-btn danger aggressive-shape"
                >
                    ← Volver al Menú<span aria-hidden></span>
                    <span aria-hidden className="cybr-btn__glitch">Back</span>
                    <span aria-hidden className="cybr-btn__tag custom">ESC</span>
                </button>
            </div>

            {/* Contenedor principal */}
            <div style={{
                backgroundColor: 'rgba(31, 15, 47, 0.8)',
                border: '2px solid rgb(243, 33, 138)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h2 style={{ fontFamily: 'Press Start 2P', color: 'rgb(243, 33, 138)', marginTop: 0, marginBottom: '20px' }}>Catalogo de Cartas</h2>
            

                {/* Sección del catálogo y decks */}
                <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '20px', 
                    marginBottom: '20px' 
                }}>
                    {/* Catálogo de cartas */}
                    <div style={{ flex: '1', minWidth: '300px' }}>
                    
                        <button
                            className="cybr-btn small load-deck"
                            onClick={cargarTodasLasCartas}
                            style={{
                                backgroundColor: 'transparent',
                                zIndex: 1,
                                marginBottom: '10px',
                            }}
                        >
                
                            Cargar Cartas <span aria-hidden></span>
                            <span aria-hidden className="cybr-btn__glitch">Load Cards</span>
                            <span aria-hidden className="cybr-btn__tag custom">CTRL+L</span>
                        </button>
                        
                        {/* Controles de filtrado */}
                        <div style={{ marginBottom: '10px' }}>
                            <input
                                type="text"
                                placeholder="Buscar cartas..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                style={{
                                    padding: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    width: '200px',
                                    marginRight: '10px'
                                }}
                            />
                            <select
                                value={filterType}
                                onChange={handleTypeFilterChange}
                                style={{
                                    padding: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                }}
                            >
                                <option value="">Todos los tipos</option>
                                <option value="unit">Aliado</option>
                                <option value="spell">Hechizo</option>
                                <option value="legend">Personaje</option>
                            </select>
                        </div>

                        {/* Lista de cartas */}
                        <div style={{
                            maxHeight: '300px',
                            overflowY: 'auto',
                            border: '1px solid #ddd',
                            padding: '10px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px'
                        }}>
                            {filteredCards.length === 0 ? (
                                <p>No se encontraron cartas.</p>
                            ) : (
                                filteredCards.map(card => renderCatalogCard(card))
                            )}
                        </div>
                    </div>
                </div>

                {/* Decks */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                    {/* Deck 1 */}
                    <div style={{ flex: 1 }}>
                        <h3>Deck 1</h3>
                        <div style={{ marginBottom: '10px' }}>
                            <input
                                type="text"
                                placeholder="Nombre del Deck 1"
                                value={deck1Name}
                                onChange={(e) => setDeck1Name(e.target.value)}
                                style={{
                                    padding: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    width: '200px',
                                    marginRight: '10px'
                                }}
                            />
                            <button
                                onClick={() => limpiarBaraja(1)}
                                className="cybr-btn danger small logout-btn"
                                style={{
                                    backgroundColor: 'transparent',
                                    zIndex: 1,
                                }}
                            >
                                Limpiar deck<span aria-hidden></span>
                                <span aria-hidden className="cybr-btn__glitch">Clean Deck</span>
                                <span aria-hidden className="cybr-btn__tag custom">ESC</span>
                            </button>
                        </div>
                        
                        <div style={{
                            height: '150px',
                            maxHeight: '300px',
                            overflowY: 'scroll',
                            border: '1px solid #ddd',
                            padding: '10px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px'
                        }}>
                            {deck1Cards.map(card => renderDeckCard(card, 1))}
                        </div>
                    </div>

                    {/* Deck 2 */}
                    <div style={{ flex: 1 }}>
                        <h3>Deck 2</h3>
                        <div style={{ marginBottom: '10px' }}>
                            <input
                                type="text"
                                placeholder="Nombre del Deck 2"
                                value={deck2Name}
                                onChange={(e) => setDeck2Name(e.target.value)}
                                style={{
                                    padding: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    width: '200px',
                                    marginRight: '10px'
                                }}
                            />
                            <button
                                onClick={() => limpiarBaraja(1)}
                                className="cybr-btn danger small logout-btn"
                                style={{
                                    backgroundColor: 'transparent',
                                    zIndex: 1,
                                }}
                            >
                                Limpiar deck<span aria-hidden></span>
                                <span aria-hidden className="cybr-btn__glitch">Clean Deck</span>
                                <span aria-hidden className="cybr-btn__tag custom">ESC</span>
                            </button>
                        </div>
                        
                        <div style={{
                            height: '150px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            border: '1px solid #ddd',
                            padding: '10px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px'
                        }}>
                            {deck2Cards.map(card => renderDeckCard(card, 2))}
                        </div>
                    </div>
                </div>

                {/* Botón para generar JSON */}
                <button
                    className="cybr-btn save-deck small"
                    onClick={generateDeckFormat}
                    style={{
                        background: 'transparent',
                        zIndex: 1,
                    }}
                >
                    Guardar deck<span aria-hidden></span>
                    <span aria-hidden className="cybr-btn__glitch">Save Deck</span>
                    <span aria-hidden className="cybr-btn__tag custom">CTRL+S</span>
                </button>

            </div>
        </div>
    );
};

export default DeckCreator;