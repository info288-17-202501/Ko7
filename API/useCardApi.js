// Hook para utilizar la API de cartas desde los componentes de React
import { useState, useEffect } from 'react';
import * as cardApi from '../mapa-cartas-ui/src/cardApiClient.js';

/**
 * Hook personalizado para gestionar las operaciones de cartas
 * @returns {Object} - Funciones y estados para trabajar con cartas
 */
export const useCardApi = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar todas las cartas
  const fetchCards = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await cardApi.getCards();
      setCards(data);
    } catch (err) {
      setError(err.message || 'Error al cargar las cartas');
      console.error('Error en useCardApi.fetchCards:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar una carta específica
  const fetchCardById = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      return await cardApi.getCardById(id);
    } catch (err) {
      setError(err.message || `Error al cargar la carta ${id}`);
      console.error(`Error en useCardApi.fetchCardById(${id}):`, err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Crear una nueva carta
  const addCard = async (cardData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newCard = await cardApi.createCard(cardData);
      setCards(prevCards => [...prevCards, newCard]);
      return newCard;
    } catch (err) {
      setError(err.message || 'Error al crear la carta');
      console.error('Error en useCardApi.addCard:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar una carta existente
  const updateCard = async (id, cardData) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedCard = await cardApi.updateCard(id, cardData);
      setCards(prevCards => 
        prevCards.map(card => card.id === id ? updatedCard : card)
      );
      return updatedCard;
    } catch (err) {
      setError(err.message || `Error al actualizar la carta ${id}`);
      console.error(`Error en useCardApi.updateCard(${id}):`, err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar una carta
  const removeCard = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await cardApi.deleteCard(id);
      setCards(prevCards => prevCards.filter(card => card.id !== id));
      return true;
    } catch (err) {
      setError(err.message || `Error al eliminar la carta ${id}`);
      console.error(`Error en useCardApi.removeCard(${id}):`, err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cargar cartas al montar el componente
  useEffect(() => {
    fetchCards();
  }, []);

  return {
    cards,
    loading,
    error,
    fetchCards,
    fetchCardById,
    addCard,
    updateCard,
    removeCard
  };
};
