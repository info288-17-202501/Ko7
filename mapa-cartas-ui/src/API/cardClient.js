/**
 * Cliente API para el frontend
 * Este módulo contiene todas las funciones para comunicarse con la API
 */

const API_BASE_URL = 'http://localhost:3030/api';

/**
 * Maneja las respuestas HTTP y los errores
 * @param {Response} response - La respuesta de fetch
 * @returns {Promise} - Datos procesados o error
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    // Si el status no es 2xx, intentamos obtener el mensaje de error del servidor
    const errorData = await response.json().catch(() => ({
      message: 'Error desconocido en el servidor'
    }));
    
    throw new Error(errorData.message || `Error HTTP: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Obtiene todas las cartas
 * @returns {Promise<Array>} - Lista de cartas
 */
const getCards = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/cards`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error al obtener las cartas:', error);
    throw error;
  }
};

/**
 * Obtiene una carta por su ID
 * @param {number} id - ID de la carta a obtener
 * @returns {Promise<Object>} - Datos de la carta
 */
const getCardById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cards/${id}`);
    return handleResponse(response);
  } catch (error) {
    console.error(`Error al obtener la carta con ID ${id}:`, error);
    throw error;
  }
};

/**
 * Crea una nueva carta
 * @param {Object} cardData - Datos de la carta a crear
 * @returns {Promise<Object>} - Carta creada
 */
const createCard = async (cardData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cardData)
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error al crear la carta:', error);
    throw error;
  }
};

/**
 * Actualiza una carta existente
 * @param {number} id - ID de la carta a actualizar
 * @param {Object} cardData - Nuevos datos de la carta
 * @returns {Promise<Object>} - Carta actualizada
 */
const updateCard = async (id, cardData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cardData)
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error(`Error al actualizar la carta con ID ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina una carta
 * @param {number} id - ID de la carta a eliminar
 * @returns {Promise<Object>} - Respuesta de confirmación
 */
const deleteCard = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
      method: 'DELETE'
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error(`Error al eliminar la carta con ID ${id}:`, error);
    throw error;
  }
};

// Exportar todas las funciones para su uso
module.exports = {
  getCards,
  getCardById,
  createCard,
  updateCard,
  deleteCard
};
