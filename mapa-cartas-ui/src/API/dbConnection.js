/**
 * Gestión de la conexión a la base de datos
 * Este módulo se encarga de establecer y mantener la conexión con PostgreSQL
 */

const { Pool } = require('pg');
require('dotenv').config();

// Creamos un pool de conexiones para una mejor gestión de recursos
// Usamos directamente la configuración en lugar de importar desde dbConfig.js
// Es importante usar comillas para el nombre de la base de datos con espacios
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'Card Details DB',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'tobybd',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Evento para cuando se establece una conexión
pool.on('connect', () => {
  console.log('Conexión establecida con la base de datos PostgreSQL');
});

// Evento para cuando hay un error en la conexión
pool.on('error', (err) => {
  console.error('Error inesperado en el cliente de PostgreSQL', err);
  process.exit(-1);
});

/**
 * Ejecuta una consulta SQL en la base de datos
 * @param {string} text - Consulta SQL a ejecutar
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise} - Resultado de la consulta
 */
const query = async (text, params) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Consulta ejecutada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
    throw error;
  }
};

module.exports = {
  query,
  pool
};
