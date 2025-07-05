const express = require('express');
const router = express.Router();
const cardRepository = require('../repositories/cardRepository');

// Get color based on rarity
const getColorByRarity = (rarity) => {
    switch (rarity) {
        case 'Comun': return '#8e9ba9'; // Bluish gray
        case 'Infrecuente': return '#4fc3f7'; // Light blue
        case 'Rara': return '#4fc3f7'; // Purple
        case 'Epica': return '#7e57c2'; // Orange
        case 'Legendaria': return '#ffd700'; // Gold
        default: return '#33a8ff'; // Default blue
    }
};

router.get('/cards', async (req, res) => {
    try {
        const cards = await cardRepository.getAllCards();
        console.log('Cards retrieved from DB:', cards.length);

        const cardWithEffects = cards.find(card => card.effects && card.effects.length > 0);
        if (cardWithEffects) {
            console.log('=== CARD WITH EFFECTS FOUND ===');
            console.log('ID:', cardWithEffects.IdCarta);
            console.log('Effects:', cardWithEffects.effects);
            console.log('Arrows:', cardWithEffects.arrows);
            console.log('===============================');
        } else {
            console.log('NO CARDS WITH EFFECTS FOUND');
        }

        const transformedCards = cards.map(card => {
            console.log(`Processing card: ID=${card.IdCarta}, Name=${card.Nombre}, Type=${card.type}, Rarity=${card.Rareza}`);
            
            return {
                id: card.IdCarta,
                type: card.type ,
                color: getColorByRarity(card.Rareza),
                name: card.Nombre || 'Unnamed',
                rarity: card.Rareza || 'Common',
                image: card.imagePath || null,
                attack: card.typeDetails?.attack ,
                health: card.typeDetails?.health,
                cost: card.typeDetails?.cost,
                actions: card.typeDetails?.actions,
                effects: (() => {
                    if (!card.effects || !Array.isArray(card.effects) || card.effects.length === 0) {
                        return [];
                    }

                    // Agrupar efectos por ID para evitar duplicados debido a múltiples flechas
                    const groupedEffects = new Map();
                    card.effects.forEach(effect => {
                        if (effect && effect.effectId) {
                            const key = effect.effectId;
                            if (!groupedEffects.has(key)) {
                                // Solo agregar el efecto si no existe, NO sumar cantidades
                                groupedEffects.set(key, {
                                    id: effect.effectId,
                                    name: effect.name,
                                    description: effect.description,
                                    type: effect.type,
                                    amount: effect.amount || 1, // Usar la cantidad original, no sumar
                                    target: effect.target,
                                    duration: effect.duration,
                                    repeatable: effect.repeatable,
                                    trigger: effect.trigger
                                });
                            }
                            // Si ya existe, no hacer nada (evitar duplicados)
                        }
                    });

                    return Array.from(groupedEffects.values());
                })(),
                arrows: card.arrows || [],
                movements: card.arrows?.map(arrow => ({
                    direction: arrow.direction,
                    //range: arrow.range || 1,
                    //targetType: arrow.targetType
                })) || []
            };
        });

        res.json(transformedCards);
    } catch (error) {
        console.error('Error retrieving cards from DB:', error);

        const testCards = [
            // ...your test cards...
        ];
        res.json(testCards);
    }
});

module.exports = router;
