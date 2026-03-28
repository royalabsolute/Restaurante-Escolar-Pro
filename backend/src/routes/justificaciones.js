const express = require('express');
const router = express.Router();
const justificacionesController = require('../controllers/justificacionesController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para justificaciones
router.get('/', justificacionesController.getAll);
router.get('/mis-justificaciones', justificacionesController.getMisJustificaciones);
router.get('/pendientes', justificacionesController.getPendientes);
router.get('/aprobadas', justificacionesController.getAprobadas);
router.get('/rechazadas', justificacionesController.getRechazadas);
router.post('/', justificacionesController.create);
router.put('/:id/aprobar', justificacionesController.aprobar);
router.put('/:id/rechazar', justificacionesController.rechazar);

module.exports = router;
