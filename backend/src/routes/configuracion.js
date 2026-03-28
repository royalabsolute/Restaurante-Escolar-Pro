// routes/configuracion.js
const express = require('express');
const router = express.Router();
const ConfigController = require('../controllers/configController');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)
router.get('/institucion', ConfigController.obtenerConfiguracion);
router.get('/cupos/estadisticas', ConfigController.obtenerEstadisticasCupos);

// Rutas protegidas (requieren autenticación de admin)
const { requireAdmin } = require('../middleware/auth');
router.put('/institucion', authenticateToken, requireAdmin, ConfigController.actualizarConfiguracion);
router.put('/cupos/limite', authenticateToken, requireAdmin, ConfigController.actualizarLimiteCupos);

module.exports = router;
