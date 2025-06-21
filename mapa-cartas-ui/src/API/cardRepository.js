/**
 * Operaciones de la API relacionadas con las cartas
 * Este módulo contiene todas las funciones para interactuar con la tabla de cartas
 */

const db = require('./dbConnection');

/**
 * Obtiene todas las cartas de la base de datos
 * @returns {Promise<Array>} - Lista de cartas
 */
const getAllCards = async () => {
  try {
    console.log('Ejecutando getAllCards...');
    // Obtenemos primero la información básica de todas las cartas
    const cardsResult = await db.query(`
      SELECT c.*, i."Ruta" as imagenRuta 
      FROM "Carta" c 
      LEFT JOIN "Imagen" i ON c."IdCarta" = i."IdCarta" 
      ORDER BY c."IdCarta"
    `);
    
    // Arreglo para almacenar las cartas con información completa
    const cards = [];
    
    // Para cada carta, obtener su tipo específico y detalles
    for (const card of cardsResult.rows) {
      // Consultamos si la carta es un Hechizo
      const hechizoResult = await db.query('SELECT * FROM "Hechizo" WHERE "IdCarta" = $1', [card.IdCarta]);
      if (hechizoResult.rows.length > 0) {
        card.tipo = 'Hechizo';
        card.detallesTipo = hechizoResult.rows[0];
      }
      
      // Consultamos si la carta es un Aliado con una consulta mejorada
      const aliadoResult = await db.query(`
        SELECT a."IdCarta", a."Costo", a."Ataque", a."Vida" 
        FROM "Aliado" a 
        WHERE a."IdCarta" = $1
      `, [card.IdCarta]);
      if (aliadoResult.rows.length > 0) {
        card.tipo = 'Aliado';
        card.detallesTipo = aliadoResult.rows[0];
        // Debug para ver exactamente qué contiene aliadoResult
        console.log(`Aliado ${card.IdCarta} detalles:`, aliadoResult.rows[0]);
      }
      
      // Consultamos si la carta es un Personaje
      const personajeResult = await db.query('SELECT * FROM "Personaje" WHERE "IdCarta" = $1', [card.IdCarta]);
      if (personajeResult.rows.length > 0) {
        card.tipo = 'Personaje';
        card.detallesTipo = personajeResult.rows[0];
      }
      
      // Consultamos los efectos asociados a la carta
      const efectosResult = await db.query(`
        SELECT e.* 
        FROM "Efecto" e
        JOIN "Tiene" t ON e."IdEfecto" = t."IdEfecto"
        WHERE t."IdCarta" = $1
      `, [card.IdCarta]);
      
      // Añadimos los efectos a la carta
      card.efectos = efectosResult.rows;
      
      // Añadimos la carta completa al arreglo
      cards.push(card);
    }
    
    console.log('Consulta getAllCards completada con éxito');
    console.log('Ejemplo de carta con detalles:', cards.length > 0 ? 
      {
        id: cards[0].IdCarta,
        tipo: cards[0].tipo,
        detallesTipo: cards[0].detallesTipo
      } : 'No hay cartas');
      
    return cards;
  } catch (error) {
    console.error('Error al obtener todas las cartas:', error);
    throw error;
  }
};

/**
 * Obtiene una carta por su ID
 * @param {number} id - ID de la carta a buscar
 * @returns {Promise<Object>} - Datos de la carta con información adicional
 */
const getCardById = async (id) => {
  try {
    // Consultamos la información básica de la carta
    const cartaResult = await db.query(`
      SELECT c.*, i."Ruta" as imagenRuta 
      FROM "Carta" c
      LEFT JOIN "Imagen" i ON c."IdCarta" = i."IdCarta"
      WHERE c."IdCarta" = $1
    `, [id]);

    if (!cartaResult.rows[0]) {
      return null;
    }

    const carta = cartaResult.rows[0];
    
    // Consultamos el tipo de carta (Hechizo, Aliado o Personaje)
    // Consultas mejoradas para cada tipo específico de carta
    const hechizoResult = await db.query('SELECT * FROM "Hechizo" WHERE "IdCarta" = $1', [id]);
    
    // Para Aliado, vamos a asegurarnos de incluir todos los campos relevantes
    const aliadoResult = await db.query(`
      SELECT a."IdCarta", a."Costo", a."Ataque", a."Vida"
      FROM "Aliado" a
      WHERE a."IdCarta" = $1
    `, [id]);
    
    const personajeResult = await db.query(`
      SELECT p."IdCarta", p."Acciones", p."Ataque", p."Vida"
      FROM "Personaje" p
      WHERE p."IdCarta" = $1
    `, [id]);
    
    // Consultamos los efectos asociados a la carta
    const efectosResult = await db.query(`
      SELECT e.*, t.* 
      FROM "Efecto" e
      JOIN "Tiene" t ON e."IdEfecto" = t."IdEfecto"
      WHERE t."IdCarta" = $1
    `, [id]);
    
    // Añadimos toda la información a la carta
    carta.efectos = efectosResult.rows;
    
    if (hechizoResult.rows.length > 0) {
      carta.tipo = 'Hechizo';
      carta.detallesTipo = hechizoResult.rows[0];
    } else if (aliadoResult.rows.length > 0) {
      carta.tipo = 'Aliado';
      carta.detallesTipo = aliadoResult.rows[0];
    } else if (personajeResult.rows.length > 0) {
      carta.tipo = 'Personaje';
      carta.detallesTipo = personajeResult.rows[0];
    }
    
    return carta;
  } catch (error) {
    console.error(`Error al obtener la carta con ID ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene información sobre todas las cartas de un tipo específico
 * @param {string} tipo - Tipo de carta ('Hechizo', 'Aliado', 'Personaje')
 * @returns {Promise<Array>} - Lista de cartas del tipo especificado
 */
const getCardsByType = async (tipo) => {
  try {
    let query;
    switch (tipo.toLowerCase()) {
      case 'hechizo':
        query = `
          SELECT c.*, h."Costo", i."Ruta" as imagenRuta 
          FROM "Carta" c
          JOIN "Hechizo" h ON c."IdCarta" = h."IdCarta"
          LEFT JOIN "Imagen" i ON c."IdCarta" = i."IdCarta"
          ORDER BY c."IdCarta"
        `;
        break;
      case 'aliado':
        query = `
          SELECT c.*, a."Costo", a."Ataque", a."Vida", i."Ruta" as imagenRuta 
          FROM "Carta" c
          JOIN "Aliado" a ON c."IdCarta" = a."IdCarta"
          LEFT JOIN "Imagen" i ON c."IdCarta" = i."IdCarta"
          ORDER BY c."IdCarta"
        `;
        break;
      case 'personaje':
        query = `
          SELECT c.*, p."Acciones", p."Ataque", p."Vida", i."Ruta" as imagenRuta 
          FROM "Carta" c
          JOIN "Personaje" p ON c."IdCarta" = p."IdCarta"
          LEFT JOIN "Imagen" i ON c."IdCarta" = i."IdCarta"
          ORDER BY c."IdCarta"
        `;
        break;
      default:
        throw new Error('Tipo de carta no válido');
    }
    
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    console.error(`Error al obtener cartas de tipo ${tipo}:`, error);
    throw error;
  }
};

/**
 * Obtiene todos los efectos de la base de datos
 * @returns {Promise<Array>} - Lista de efectos
 */
const getAllEfectos = async () => {
  try {
    const result = await db.query('SELECT * FROM "Efecto" ORDER BY "IdEfecto"');
    return result.rows;
  } catch (error) {
    console.error('Error al obtener todos los efectos:', error);
    throw error;
  }
};

/**
 * Obtiene las cartas que tienen un efecto específico
 * @param {number} efectoId - ID del efecto
 * @returns {Promise<Array>} - Lista de cartas con el efecto
 */
const getCartasByEfecto = async (efectoId) => {
  try {
    const result = await db.query(`
      SELECT c.*, t."Cantidad", t."Objetivo", t."Duracion", t."Repetible", t."Trigger", t."Flechas"
      FROM "Carta" c
      JOIN "Tiene" t ON c."IdCarta" = t."IdCarta"
      WHERE t."IdEfecto" = $1
      ORDER BY c."IdCarta"
    `, [efectoId]);
    return result.rows;
  } catch (error) {
    console.error(`Error al obtener cartas con efecto ${efectoId}:`, error);
    throw error;
  }
};

module.exports = {
  getAllCards,
  getCardById,
  getCardsByType,
  getAllEfectos,
  getCartasByEfecto
};
