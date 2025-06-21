const express = require('express');
const router = express.Router();
const cardRepository = require('../cardRepository');

// Función para obtener color según rareza
const getColorByRarity = (rarity) => {
    switch(rarity) {
        case 'Común': return '#8e9ba9'; // Gris azulado
        case 'Infrecuente': return '#4fc3f7'; // Azul claro
        case 'Rara': return '#7e57c2'; // Morado
        case 'Épica': return '#ff9800'; // Naranja
        case 'Legendaria': return '#ffd700'; // Dorado
        default: return '#33a8ff'; // Azul por defecto
    }
};

router.get('/cards', async (req, res) => {
    try {
        // Intenta obtener las cartas de la base de datos
        const cards = await cardRepository.getAllCards();
        console.log('Cartas obtenidas de la BD:', cards.length);
        
        // Transforma los datos para que tengan el formato que espera el frontend
        const transformedCards = cards.map(card => ({
            id: card.IdCarta,
            type: card.tipo === 'Hechizo' ? 'H' : 
                  card.tipo === 'Aliado' ? 'A' : 
                  card.tipo === 'Personaje' ? 'P' : 'O',
            color: getColorByRarity(card.Rareza),
            name: card.Nombre || 'Sin nombre',
            rarity: card.Rareza || 'Común',
            description: card.Descripcion || 'Sin descripción',
            stats: {
                attack: card.detallesTipo?.Ataque,
                health: card.detallesTipo?.Vida,
                cost: card.detallesTipo?.Costo,
                actions: card.detallesTipo?.Acciones
            }
        }));
        
        res.json(transformedCards);
    } catch (error) {
        // Si hay un error con la base de datos, devuelve cartas de prueba
        console.error('Error al obtener cartas de la BD:', error);
        
        // Cartas de prueba mejoradas con más variedad para probar la interfaz
        const testCards = [
            {
                id: 1,
                type: 'A',
                color: '#8e9ba9', // Gris azulado para Común
                name: 'Guerrero Novato',
                rarity: 'Común',
                description: 'Un valiente guerrero que apenas comienza su aventura. Leal pero inexperto.',
                stats: { attack: 2, health: 3, cost: 1 }
            },
            {
                id: 2,
                type: 'H',
                color: '#4fc3f7', // Azul claro para Infrecuente
                name: 'Destello Arcano',
                rarity: 'Infrecuente',
                description: 'Un rápido hechizo que aturde al enemigo y permite robar una carta.',
                stats: { cost: 2 }
            },
            {
                id: 3, 
                type: 'P',
                color: '#7e57c2', // Morado para Rara
                name: 'Arquero de Élite',
                rarity: 'Rara',
                description: 'Maestro del arco largo. Puede atacar dos veces por turno.',
                stats: { attack: 3, health: 2, actions: 2, cost: 3 }
            },
            {
                id: 4,
                type: 'A',
                color: '#ff9800', // Naranja para Épica
                name: 'Golem de Cristal',
                rarity: 'Épica',
                description: 'Criatura de cristal puro que refleja los hechizos enemigos. Inmune a daño mágico.',
                stats: { attack: 4, health: 6, cost: 5 }
            },
            {
                id: 5,
                type: 'H',
                color: '#ffd700', // Dorado para Legendaria
                name: 'Furia de los Ancestros',
                rarity: 'Legendaria',
                description: 'Invoca el poder de tus antepasados. Otorga +2/+2 a todas tus unidades y les permite atacar de inmediato.',
                stats: { cost: 7 }
            },
            {
                id: 6,
                type: 'P',
                color: '#ffd700', // Dorado para Legendaria
                name: 'Archimago Khadgar',
                rarity: 'Legendaria',
                description: 'El mago más poderoso del reino. Duplica el efecto de todos tus hechizos.',
                stats: { attack: 6, health: 8, actions: 1, cost: 8 }
            }
        ];
        res.json(testCards);
    }
});

module.exports = router;