// src/routes/partidoRoutes.js
const { Router } = require('express');
const { obtenerPartidosDeLiga } = require('../controllers/partidoController');

const router = Router();

// Endpoint que responderá a: http://localhost:3001/api/partidos?liga=X
router.get('/partidos', obtenerPartidosDeLiga);

module.exports = router;