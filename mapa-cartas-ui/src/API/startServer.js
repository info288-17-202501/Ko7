/**
 * Script para iniciar el servidor API
 */

// Importar el módulo del servidor
const server = require('./server');

// El servidor ya se inicia automáticamente en server.js
console.log('API del juego de cartas iniciada. Presiona Ctrl+C para detener.');

// Manejar señales de terminación para un apagado limpio
process.on('SIGTERM', () => {
  console.log('Señal SIGTERM recibida. Cerrando el servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Señal SIGINT recibida. Cerrando el servidor...');
  process.exit(0);
});
