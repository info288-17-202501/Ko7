// Al final del archivo, antes de module.exports, agrega estas funciones:
const db = require('../dbConnection');
/**
 * Obtiene todas las barajas
 * @returns {Promise<Array>} - Lista de barajas
 */
const getAllBarajas = async () => {
  try {
    console.log('Ejecutando getAllBarajas...');
    const result = await db.query(`
      SELECT b.*, COUNT(c."IdCarta") as cantidadCartas
      FROM "Baraja" b
      LEFT JOIN "Contiene" c ON b."IdBaraja" = c."IdBaraja"
      GROUP BY b."IdBaraja", b."IdUsuario", b."NombreBaraja", b."RutaSleeve"
      ORDER BY b."IdBaraja"
    `);
    console.log('Consulta getAllBarajas completada con éxito');
    return result.rows;
  } catch (error) {
    console.error('Error al obtener todas las barajas:', error);
    throw error;
  }
};

/**
 * Obtiene una baraja por ID con todas sus cartas
 * @param {number} idBaraja - ID de la baraja
 * @returns {Promise<Object>} - Baraja con sus cartas
 */
const getBarajaById = async (idBaraja) => {
  try {
    console.log(`Obteniendo baraja con ID: ${idBaraja}`);
    
    // Obtener información básica de la baraja
    const barajaResult = await db.query(`
      SELECT * FROM "Baraja" WHERE "IdBaraja" = $1
    `, [idBaraja]);

    if (!barajaResult.rows[0]) {
      return null;
    }

    const baraja = barajaResult.rows[0];

    // Obtener cartas de la baraja
    const cartasResult = await db.query(`
      SELECT c.*, co."VariacionImagen", i."Ruta" as imagePath
      FROM "Contiene" co
      JOIN "Carta" c ON co."IdCarta" = c."IdCarta"
      LEFT JOIN "Imagen" i ON c."IdCarta" = i."IdCarta"
      WHERE co."IdBaraja" = $1
      ORDER BY c."IdCarta"
    `, [idBaraja]);

    baraja.cartas = cartasResult.rows;
    baraja.cantidadCartas = cartasResult.rows.length;

    return baraja;
  } catch (error) {
    console.error(`Error al obtener baraja con ID ${idBaraja}:`, error);
    throw error;
  }
};

/**
 * Obtiene barajas por usuario
 * @param {number} idUsuario - ID del usuario
 * @returns {Promise<Array>} - Lista de barajas del usuario
 */
const getBarajasByUsuario = async (idUsuario) => {
  try {
    console.log(`Obteniendo barajas del usuario: ${idUsuario}`);
    const result = await db.query(`
      SELECT b.*, COUNT(c."IdCarta") as cantidadCartas
      FROM "Baraja" b
      LEFT JOIN "Contiene" c ON b."IdBaraja" = c."IdBaraja"
      WHERE b."IdUsuario" = $1
      GROUP BY b."IdBaraja", b."IdUsuario", b."NombreBaraja", b."RutaSleeve"
      ORDER BY b."IdBaraja"
    `, [idUsuario]);
    
    return result.rows;
  } catch (error) {
    console.error(`Error al obtener barajas del usuario ${idUsuario}:`, error);
    throw error;
  }
};

/**
 * Crea una nueva baraja
 * @param {Object} barajaData - Datos de la baraja
 * @returns {Promise<Object>} - Baraja creada
 */
const createBaraja = async (barajaData) => {
  try {
    console.log('Creando nueva baraja:', barajaData);
    const result = await db.query(`
      INSERT INTO "Baraja" ("IdUsuario", "NombreBaraja", "RutaSleeve")
      VALUES ($1, $2, $3)
      RETURNING *
    `, [barajaData.IdUsuario, barajaData.NombreBaraja, barajaData.RutaSleeve]);
    
    console.log('Baraja creada exitosamente');
    return result.rows[0];
  } catch (error) {
    console.error('Error al crear baraja:', error);
    throw error;
  }
};

/**
 * Actualiza una baraja existente
 * @param {number} idBaraja - ID de la baraja
 * @param {Object} barajaData - Nuevos datos de la baraja
 * @returns {Promise<Object>} - Baraja actualizada
 */
const updateBaraja = async (idBaraja, barajaData) => {
  try {
    console.log(`Actualizando baraja ${idBaraja}:`, barajaData);
    const result = await db.query(`
      UPDATE "Baraja" 
      SET "IdUsuario" = $1, "NombreBaraja" = $2, "RutaSleeve" = $3
      WHERE "IdBaraja" = $4
      RETURNING *
    `, [barajaData.IdUsuario, barajaData.NombreBaraja, barajaData.RutaSleeve, idBaraja]);
    
    if (!result.rows[0]) {
      return null;
    }
    
    console.log('Baraja actualizada exitosamente');
    return result.rows[0];
  } catch (error) {
    console.error(`Error al actualizar baraja ${idBaraja}:`, error);
    throw error;
  }
};

/**
 * Elimina una baraja
 * @param {number} idBaraja - ID de la baraja
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
const deleteBaraja = async (idBaraja) => {
  try {
    console.log(`Eliminando baraja ${idBaraja}`);
    
    // Primero eliminar todas las cartas de la baraja
    await db.query('DELETE FROM "Contiene" WHERE "IdBaraja" = $1', [idBaraja]);
    
    // Luego eliminar la baraja
    const result = await db.query('DELETE FROM "Baraja" WHERE "IdBaraja" = $1', [idBaraja]);
    
    console.log('Baraja eliminada exitosamente');
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error al eliminar baraja ${idBaraja}:`, error);
    throw error;
  }
};

/**
 * Agrega una carta a una baraja
 * @param {number} idBaraja - ID de la baraja
 * @param {number} idCarta - ID de la carta
 * @param {string} variacionImagen - Variación de imagen (opcional)
 * @returns {Promise<Object>} - Registro creado
 */
const addCartaToBaraja = async (idBaraja, idCarta, variacionImagen = null) => {
  try {
    console.log(`Agregando carta ${idCarta} a baraja ${idBaraja}`);
    const result = await db.query(`
      INSERT INTO "Contiene" ("IdBaraja", "IdCarta", "VariacionImagen")
      VALUES ($1, $2, $3)
      RETURNING *
    `, [idBaraja, idCarta, variacionImagen]);
    
    console.log('Carta agregada a baraja exitosamente');
    return result.rows[0];
  } catch (error) {
    console.error(`Error al agregar carta ${idCarta} a baraja ${idBaraja}:`, error);
    throw error;
  }
};

/**
 * Remueve una carta de una baraja
 * @param {number} idBaraja - ID de la baraja
 * @param {number} idCarta - ID de la carta
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
const removeCartaFromBaraja = async (idBaraja, idCarta) => {
  try {
    console.log(`Removiendo carta ${idCarta} de baraja ${idBaraja}`);
    const result = await db.query(`
      DELETE FROM "Contiene" 
      WHERE "IdBaraja" = $1 AND "IdCarta" = $2
    `, [idBaraja, idCarta]);
    
    console.log('Carta removida de baraja exitosamente');
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error al remover carta ${idCarta} de baraja ${idBaraja}:`, error);
    throw error;
  }
};

/**
 * Obtiene todas las cartas de una baraja
 * @param {number} idBaraja - ID de la baraja
 * @returns {Promise<Array>} - Lista de cartas en la baraja
 */
const getCartasInBaraja = async (idBaraja) => {
  try {
    console.log(`Obteniendo cartas de baraja ${idBaraja}`);
    const result = await db.query(`
      SELECT c.*, co."VariacionImagen", i."Ruta" as imagePath
      FROM "Contiene" co
      JOIN "Carta" c ON co."IdCarta" = c."IdCarta"
      LEFT JOIN "Imagen" i ON c."IdCarta" = i."IdCarta"
      WHERE co."IdBaraja" = $1
      ORDER BY c."IdCarta"
    `, [idBaraja]);
    
    return result.rows;
  } catch (error) {
    console.error(`Error al obtener cartas de baraja ${idBaraja}:`, error);
    throw error;
  }
};

/**
 * Obtiene dos barajas específicas y las formatea para ser usadas en una partida
 * Devuelve el formato JSON como string para ser leído desde C++
 * @param {number} baraja1Id - ID de la primera baraja
 * @param {number} baraja2Id - ID de la segunda baraja
 * @returns {string} JSON string con el formato de decks para la partida
 */
const getDecksFromBarajasForGame = async (baraja1Id, baraja2Id) => {
  try {
    console.log(`Obteniendo barajas para partida: ${baraja1Id} y ${baraja2Id}`);
    
    // Obtener ambas barajas con sus cartas
    const [baraja1, baraja2] = await Promise.all([
      getBarajaById(baraja1Id),
      getBarajaById(baraja2Id)
    ]);
    
    if (!baraja1 || !baraja2) {
      throw new Error(`Una o ambas barajas no existen (${baraja1Id}, ${baraja2Id})`);
    }
    
    // Las cartas ya están incluidas en baraja1.cartas y baraja2.cartas
    // No necesitamos una función adicional para obtenerlas
    const cartas1 = baraja1.cartas || [];
    const cartas2 = baraja2.cartas || [];
    
    // Intentamos obtener todas las cartas de la API para tener datos completos
    let allCardsFromApi = [];
    try {
      const response = await fetch('http://localhost:3030/api/cards');
      if (response.ok) {
        allCardsFromApi = await response.json();
        console.log(`Datos de API obtenidos: ${allCardsFromApi.length} cartas`);
      }
    } catch (error) {
      console.warn('No se pudieron obtener cartas desde la API, usando valores por defecto:', error.message);
    }
    
    // Función para formatear las cartas según el formato requerido
    const formatDeckCards = (cards) => {
      return cards.map(card => {
        // Buscar la carta completa en la API primero
        const cardFromApi = allCardsFromApi.find(c => c.id === (card.IdCarta || card.id));
        
        // Procesar arrows/movements si existen
        let arrows = [];
        if (cardFromApi && cardFromApi.arrows && cardFromApi.arrows.length > 0) {
          arrows = cardFromApi.arrows.map(arrow => ({
            direction: arrow.direction,
            //range: arrow.range || 1,
            //targetType: arrow.targetType || "any"
          }));
        }
        
        // Procesar efectos si existen
        let effects = [];
        if (cardFromApi && cardFromApi.effects && cardFromApi.effects.length > 0) {
          effects = cardFromApi.effects.map(effect => ({
            type: effect.type || "unknown",
            target: effect.target || null,
            value: effect.amount || 0,
            trigger: effect.trigger || null,
            direction: arrows  // Aquí incluimos las flechas dentro de cada efecto
          }));
        }
        
        return {
          id: card.IdCarta || card.id,
          name: cardFromApi?.name || card.Nombre || "Unnamed",
          cost: cardFromApi?.cost || 1,
          type: cardFromApi?.type || "unit",
          attack: cardFromApi?.attack || 1,
          health: cardFromApi?.health || 1,
          speed: 1,
          range: 1,
          effects: effects
        };
      });
    };
    
    // Formato requerido exactamente como se especificó
    const gameDecksFormat = {
      decks: [
        {
          name: baraja1.NombreBaraja || `Baraja ${baraja1Id}`,
          cards: formatDeckCards(cartas1)
        },
        {
          name: baraja2.NombreBaraja || `Baraja ${baraja2Id}`,
          cards: formatDeckCards(cartas2)
        }
      ]
    };
    
    // Convertir a JSON string para C++
    const jsonString = JSON.stringify(gameDecksFormat, null, 0); // Sin indentación para C++
    
    console.log(`Formato de barajas generado exitosamente. Total cartas: ${cartas1.length + cartas2.length}`);
    console.log('Primer deck:', gameDecksFormat.decks[0].name, `(${gameDecksFormat.decks[0].cards.length} cartas)`);
    console.log('Segundo deck:', gameDecksFormat.decks[1].name, `(${gameDecksFormat.decks[1].cards.length} cartas)`);
    
    return jsonString;
    
  } catch (error) {
    console.error('Error en getDecksFromBarajasForGame:', error);
    throw error;
  }
};

/**
 * Verifica si un usuario tiene al menos una baraja disponible
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object>} - { success: boolean, barajaId: number|null, message: string }
 */
const getUserDeckForMatchmaking = async (userId) => {
  try {
    // Obtener barajas del usuario
    const barajas = await getBarajasByUsuario(userId);
    
    // Verificar si el usuario tiene barajas
    if (!barajas || barajas.length === 0) {
      return { 
        success: false, 
        barajaId: null, 
        message: 'El usuario no tiene barajas disponibles para jugar' 
      };
    }
    
    // Obtener la primera baraja (o podrías implementar alguna lógica para seleccionar la mejor)
    const primeraBaraja = barajas[0];
    
    // Verificar si la baraja tiene cartas
    if (primeraBaraja.cantidadCartas < 1) {
      return { 
        success: false, 
        barajaId: primeraBaraja.IdBaraja, 
        message: 'La baraja seleccionada está vacía, debe tener al menos una carta' 
      };
    }
    
    return { 
      success: true, 
      barajaId: primeraBaraja.IdBaraja, 
      message: 'Baraja lista para jugar',
      nombreBaraja: primeraBaraja.NombreBaraja
    };
  } catch (error) {
    console.error(`Error al verificar barajas del usuario ${userId}:`, error);
    return { 
      success: false, 
      barajaId: null, 
      message: 'Error al verificar barajas del usuario' 
    };
  }
};

/**
 * Envía una solicitud al servicio de matchmaking con la información de la baraja del jugador
 * @param {string} action - Acción a realizar ('joinMatch', 'leaveMatch', etc.)
 * @param {number} playerId - ID del jugador
 * @param {Object} additionalData - Datos adicionales para la solicitud
 * @returns {Promise<Object>} - Respuesta del servidor de matchmaking
 */
const sendMatchmakingRequest = async (action, playerId, additionalData = {}) => {
  const matchmakingUrl = 'http://127.0.0.1:9001';
  
  try {
    console.log(`Enviando solicitud de ${action} para el jugador ${playerId}`);
    
    // Si la acción es para unirse a un juego, verificar la baraja del usuario
    if (action === 'joinMatch' && !additionalData.barajaId) {
      const deckInfo = await getUserDeckForMatchmaking(playerId);
      
      if (!deckInfo.success) {
        console.warn(`No se pudo obtener baraja para el jugador ${playerId}: ${deckInfo.message}`);
        return {
          status: 'error',
          message: deckInfo.message
        };
      }
      
      // Agregar el ID de la baraja a los datos adicionales
      additionalData.barajaId = deckInfo.barajaId;
      additionalData.nombreBaraja = deckInfo.nombreBaraja;
    }
    
    // Preparar datos para la solicitud
    const requestData = {
      action: action,
      playerId: playerId,
      ...additionalData
    };
    
    // Enviar solicitud al servicio de matchmaking
    const response = await fetch(matchmakingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      throw new Error(`Error en solicitud de matchmaking: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Respuesta de matchmaking para ${action}:`, data);
    
    return data;
  } catch (error) {
    console.error(`Error al enviar solicitud de matchmaking (${action}):`, error);
    return {
      status: 'error',
      message: `Error de conexión con el servidor de matchmaking: ${error.message}`
    };
  }
};



module.exports = {
 getAllBarajas,
  getBarajaById,
  getBarajasByUsuario,
  createBaraja,
  updateBaraja,
  deleteBaraja,
  addCartaToBaraja,
  removeCartaFromBaraja,
  getCartasInBaraja,
  //checkPropietary, // POST
  getDecksFromBarajasForGame,  // websocket
  getUserDeckForMatchmaking,
  sendMatchmakingRequest
};