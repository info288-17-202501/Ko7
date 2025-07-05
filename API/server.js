/**
 * Servidor Express para la API de Cartas
 * Este archivo configura y arranca el servidor API
 */

const express = require('express');
const cors = require('cors');
const cardRoutes = require('./routes/cardRoutes');
const barajaRoutes = require('./routes/barajaRoutes');


// Inicializar la aplicación de Express
const app = express();
const PORT = process.env.PORT || 3030;

// Middleware
app.use(cors()); // Habilitar CORS para todas las rutas
app.use(express.json()); // Parsear solicitudes con JSON
app.use(express.urlencoded({ extended: true })); // Parsear solicitudes con formularios

// Rutas
app.use('/api', cardRoutes);
app.use('/api', barajaRoutes);

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Cartas' });
});

// Iniciar el servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

// Exportar tanto la aplicación como el servidor para pruebas y manejo externo
module.exports = { app, server };

