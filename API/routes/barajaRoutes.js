const express = require('express');
const router = express.Router();
const cardRepository = require('../repositories/barajaRepository');

// Obtener todas las barajas
router.get('/barajas', async (req, res) => {
    try {
        const barajas = await cardRepository.getAllBarajas();
        console.log('Barajas retrieved from DB:', barajas.length);
        
        const transformedBarajas = barajas.map(baraja => ({
            id: baraja.IdBaraja,
            userId: baraja.IdUsuario,
            name: baraja.NombreBaraja,
            sleevePath: baraja.RutaSleeve,
            cardCount: parseInt(baraja.cantidadcartas) || 0
        }));

        res.json(transformedBarajas);
    } catch (error) {
        console.error('Error retrieving barajas from DB:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// Obtener una baraja por ID con sus cartas
router.get('/barajas/:id', async (req, res) => {
    try {
        const barajaId = parseInt(req.params.id);
        const baraja = await cardRepository.getBarajaById(barajaId);
        
        if (!baraja) {
            return res.status(404).json({
                error: 'Baraja no encontrada',
                message: `No se encontró una baraja con ID ${barajaId}`
            });
        }

        const transformedBaraja = {
            id: baraja.IdBaraja,
            userId: baraja.IdUsuario,
            name: baraja.NombreBaraja,
            sleevePath: baraja.RutaSleeve,
            cardCount: baraja.cantidadCartas,
            cards: baraja.cartas.map(carta => ({
                id: carta.IdCarta,
                name: carta.Nombre,
                rarity: carta.Rareza,
                image: carta.imagePath,
                variacionImagen: carta.VariacionImagen
            }))
        };

        res.json(transformedBaraja);
    } catch (error) {
        console.error('Error retrieving baraja by ID:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// Obtener barajas por usuario
router.get('/usuarios/:userId/barajas', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const barajas = await cardRepository.getBarajasByUsuario(userId);
        
        const transformedBarajas = barajas.map(baraja => ({
            id: baraja.IdBaraja,
            userId: baraja.IdUsuario,
            name: baraja.NombreBaraja,
            sleevePath: baraja.RutaSleeve,
            cardCount: parseInt(baraja.cantidadcartas) || 0
        }));

        res.json(transformedBarajas);
    } catch (error) {
        console.error('Error retrieving barajas by user:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// Crear una nueva baraja
router.post('/barajas', async (req, res) => {
    try {
        const { userId, name, sleevePath } = req.body;
        
        if (!userId || !name) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'userId y name son requeridos'
            });
        }

        const barajaData = {
            IdUsuario: userId,
            NombreBaraja: name,
            RutaSleeve: sleevePath || null
        };

        const nuevaBaraja = await cardRepository.createBaraja(barajaData);
        
        const transformedBaraja = {
            id: nuevaBaraja.IdBaraja,
            userId: nuevaBaraja.IdUsuario,
            name: nuevaBaraja.NombreBaraja,
            sleevePath: nuevaBaraja.RutaSleeve,
            cardCount: 0
        };

        res.status(201).json(transformedBaraja);
    } catch (error) {
        console.error('Error creating baraja:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// Actualizar una baraja
router.put('/barajas/:id', async (req, res) => {
    try {
        const barajaId = parseInt(req.params.id);
        const { userId, name, sleevePath } = req.body;
        
        if (!userId || !name) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'userId y name son requeridos'
            });
        }

        const barajaData = {
            IdUsuario: userId,
            NombreBaraja: name,
            RutaSleeve: sleevePath || null
        };

        const barajaActualizada = await cardRepository.updateBaraja(barajaId, barajaData);
        
        if (!barajaActualizada) {
            return res.status(404).json({
                error: 'Baraja no encontrada',
                message: `No se encontró una baraja con ID ${barajaId}`
            });
        }

        const transformedBaraja = {
            id: barajaActualizada.IdBaraja,
            userId: barajaActualizada.IdUsuario,
            name: barajaActualizada.NombreBaraja,
            sleevePath: barajaActualizada.RutaSleeve
        };

        res.json(transformedBaraja);
    } catch (error) {
        console.error('Error updating baraja:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// Eliminar una baraja
router.delete('/barajas/:id', async (req, res) => {
    try {
        const barajaId = parseInt(req.params.id);
        const eliminada = await cardRepository.deleteBaraja(barajaId);
        
        if (!eliminada) {
            return res.status(404).json({
                error: 'Baraja no encontrada',
                message: `No se encontró una baraja con ID ${barajaId}`
            });
        }

        res.json({
            message: 'Baraja eliminada correctamente',
            id: barajaId
        });
    } catch (error) {
        console.error('Error deleting baraja:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// Agregar carta a baraja
router.post('/barajas/:barajaId/cartas/:cartaId', async (req, res) => {
    try {
        const barajaId = parseInt(req.params.barajaId);
        const cartaId = parseInt(req.params.cartaId);
        const { variacionImagen } = req.body;

        const resultado = await cardRepository.addCartaToBaraja(barajaId, cartaId, variacionImagen);
        
        res.status(201).json({
            message: 'Carta agregada a baraja correctamente',
            barajaId: resultado.IdBaraja,
            cartaId: resultado.IdCarta,
            variacionImagen: resultado.VariacionImagen
        });
    } catch (error) {
        console.error('Error adding carta to baraja:', error);
        if (error.code === '23505') { // Duplicate key error
            res.status(409).json({
                error: 'Carta ya existe en la baraja',
                message: 'Esta carta ya está en la baraja'
            });
        } else {
            res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }
});

// Remover carta de baraja
router.delete('/barajas/:barajaId/cartas/:cartaId', async (req, res) => {
    try {
        const barajaId = parseInt(req.params.barajaId);
        const cartaId = parseInt(req.params.cartaId);

        const eliminada = await cardRepository.removeCartaFromBaraja(barajaId, cartaId);
        
        if (!eliminada) {
            return res.status(404).json({
                error: 'Carta no encontrada en la baraja',
                message: `No se encontró la carta ${cartaId} en la baraja ${barajaId}`
            });
        }

        res.json({
            message: 'Carta removida de baraja correctamente',
            barajaId: barajaId,
            cartaId: cartaId
        });
    } catch (error) {
        console.error('Error removing carta from baraja:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// Obtener cartas de una baraja
router.get('/barajas/:id/cartas', async (req, res) => {
    try {
        const barajaId = parseInt(req.params.id);
        const cartas = await cardRepository.getCartasInBaraja(barajaId);
        
        const transformedCartas = cartas.map(carta => ({
            id: carta.IdCarta,
            name: carta.Nombre,
            rarity: carta.Rareza,
            image: carta.imagePath,
            variacionImagen: carta.VariacionImagen
        }));

        res.json(transformedCartas);
    } catch (error) {
        console.error('Error retrieving cartas from baraja:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

module.exports = router;