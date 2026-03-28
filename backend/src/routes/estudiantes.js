const express = require('express');
const router = express.Router();
const estudiantesController = require('../controllers/estudiantesController');
const { authenticateToken, requireSecretaryOrAdmin } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para estudiantes (requieren admin/secretaria para estadísticas)
router.get('/stats', requireSecretaryOrAdmin, estudiantesController.getStats);
router.get('/con-estadisticas', requireSecretaryOrAdmin, estudiantesController.getEstudiantesConEstadisticas);
router.get('/historial', requireSecretaryOrAdmin, estudiantesController.getAllEstudiantesParaHistorial);
router.get('/prioritarios', estudiantesController.getPrioritarios);
router.get('/con-prioridad', requireSecretaryOrAdmin, estudiantesController.getStudentsWithPriority);
router.get('/stats-prioridad', requireSecretaryOrAdmin, estudiantesController.getPriorityStats);
router.get('/', estudiantesController.getAll);
router.get('/:id', estudiantesController.getById);
router.post('/', estudiantesController.create);
router.put('/:id', estudiantesController.update);
router.put('/:id/status', estudiantesController.changeStatus);
router.delete('/:id', estudiantesController.delete);
router.get('/qr/:codigo', estudiantesController.getByCodigoQR);
router.post('/qr/generate/:id', estudiantesController.generateQRCode);

module.exports = router;
