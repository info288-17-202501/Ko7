/**
 * API operations related to cards
 * This module contains all functions to interact with the cards table
 */

const db = require('../dbConnection');

/**
 * Fetches all cards from the database
 * @returns {Promise<Array>} - List of cards
 */
const getAllCards = async () => {
  try {
    console.log('Executing getAllCards...');
    // Fetch basic information of all cards
    const cardsResult = await db.query(`
      SELECT c.*, i."Ruta" as imagePath 
      FROM "Carta" c 
      LEFT JOIN "Imagen" i ON c."IdCarta" = i."IdCarta" 
      ORDER BY c."IdCarta"
    `);

    // Array to store cards with complete information
    const cards = [];

    // For each card, fetch its specific type and details
    for (const card of cardsResult.rows) {
      // Check if the card is a Spell
      const spellResult = await db.query('SELECT h."IdCarta", h."Costo" as cost FROM "Hechizo" h WHERE h."IdCarta" = $1', [card.IdCarta]);
      if (spellResult.rows.length > 0) {
        card.type = 'spell';
        card.typeDetails = spellResult.rows[0];
      }

      // Check if the card is an Ally with an improved query
      const allyResult = await db.query(`
        SELECT a."IdCarta", a."Costo" as cost, a."Ataque" as attack, a."Vida" as health 
        FROM "Aliado" a 
        WHERE a."IdCarta" = $1
      `, [card.IdCarta]);
      if (allyResult.rows.length > 0) {
        card.type = 'unit';
        card.typeDetails = allyResult.rows[0];
        // Debug to see exactly what allyResult contains
        console.log(`unit ${card.IdCarta} details:`, allyResult.rows[0]);
      }

      // Check if the card is a Character
      const characterResult = await db.query('SELECT * FROM "Personaje" WHERE "IdCarta" = $1', [card.IdCarta]);
      if (characterResult.rows.length > 0) {
        card.type = 'legend';
        card.typeDetails = {
            attack: characterResult.rows[0].Ataque || null,
            health: characterResult.rows[0].Vida || null,
            actions: characterResult.rows[0].Acciones || null
          };
      }

      // Query to fetch effects and arrows
      const effectsResult = await db.query(`
        SELECT e.*, t."Cantidad" as amount, t."Objetivo" as target, t."Duracion" as duration, t."Repetible" as repeatable, t."Trigger", t."Flechas" as arrows 
        FROM "Efecto" e
        JOIN "Tiene" t ON e."IdEfecto" = t."IdEfecto"
        WHERE t."IdCarta" = $1
      `, [card.IdCarta]);

      // Check the result
      console.log(`Effects for card ${card.IdCarta}:`, effectsResult.rows);
      // Specifically check if there are arrows
      const haveArrows = effectsResult.rows.filter(row => row.arrows);
      console.log(`Records with arrows: ${haveArrows.length}`);
      if (haveArrows.length > 0) {
        console.log('Example record with arrows:', haveArrows[0]);
      }

      // Process arrows from the previous query results
      card.arrows = effectsResult.rows
        .filter(row => row.arrows) // Filter only records that have arrows
        .map(row => ({
          targetType: row.target || 'Enemy',
          direction: row.arrows,
          cardId: card.IdCarta
        }));

      // Add effects to the card object
      card.effects = effectsResult.rows.map(row => ({
        effectId: row.IdEfecto,
        name: row.Nombre,
        description: row.Descripcion,
        isBasic: row.EsBasico,
        type: row.Tipo,
        amount: row.amount,
        target: row.target,
        duration: row.duration,
        repeatable: row.repetible,
        trigger: row.Trigger,
        arrows: row.arrows
      }));
      // Asegurar que la imagen se incluya en el objeto card
      card.imagePath = card.imagepath || null; // PostgreSQL convierte a minúsculas
      // General debug before adding to the array
      console.log(`=== BEFORE ADDING CARD ${card.IdCarta} TO ARRAY ===`);
      console.log('Properties:', Object.keys(card));
      console.log('Has effects?:', card.effects ? `Yes (${card.effects.length})` : 'No');
      console.log('=======================================');

      // Add the complete card to the array
      cards.push(card);
    }

    console.log('getAllCards query completed successfully');
    console.log('Example card with details:', cards.length > 0 ? 
      {
        id: cards[0].IdCarta,
        type: cards[0].type,
        typeDetails: cards[0].typeDetails
      } : 'No cards');

    return cards;
  } catch (error) {
    console.error('Error fetching all cards:', error);
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


// Actualizar el module.exports para incluir las nuevas funciones
module.exports = {
  getAllCards,
  getAllEfectos,
  getCartasByEfecto,
 
};

