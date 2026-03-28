const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const aiController = require('../controllers/aiController');
const { authenticateToken, requireCoordinadorOrAdmin } = require('../middleware/auth');

// Solo secretarias y admins pueden acceder a reportes
router.use(authenticateToken);
router.use(requireCoordinadorOrAdmin);

// Rutas para reportes (solo secretaria/admin)
router.get('/diario', reportesController.getReporteDiario);
router.get('/mensual', reportesController.getReporteMensual);
router.get('/estadisticas', reportesController.getEstadisticas);
router.get('/estadisticas-generales', reportesController.getEstadisticasGenerales);
router.get('/tendencias', reportesController.getTendencias);
router.post('/custom/preview', reportesController.getCustomReportPreview);
router.post('/custom/export', reportesController.exportCustomReport);
router.post('/custom/enviar', reportesController.sendCustomReportByEmail);
router.get('/destinatarios', reportesController.getReportDefaultRecipients);
router.post('/dashboard/overview', reportesController.getDashboardOverview);
router.post('/dashboard/grupos', reportesController.getDashboardGroupBreakdown);
router.post('/dashboard/exportar', reportesController.exportDashboardReport);
router.post('/dashboard/enviar', reportesController.sendDashboardReport);
router.post('/dashboard/analizar-ia', aiController.analyzeStatistics);

module.exports = router;
