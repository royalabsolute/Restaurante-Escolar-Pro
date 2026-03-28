const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const GruposController = require('../controllers/GruposController');
const reportesController = require('../controllers/reportesController');

// ========== GRUPOS ACADÉMICOS (público) ==========
router.get('/grupos', GruposController.getPublicGrupos);

// ========== ESTADÍSTICAS (usado por dashboards) ==========
router.get('/admin-dashboard-stats', reportesController.getEstadisticasGenerales);

// ========== LOGGING ==========
router.post('/log-activity', authenticateToken, async (req, res) => {
  try {
    const { activity_type, description } = req.body;
    await logger.audit(
      req.user.id,
      activity_type || 'LOG',
      'sistema',
      description || 'Actividad del sistema',
      req.ip
    );
    res.json({ status: 'SUCCESS', message: 'Actividad registrada exitosamente' });
  } catch (error) {
    logger.error('❌ Error registrando actividad:', error);
    res.status(500).json({ status: 'ERROR', message: 'Error interno del servidor' });
  }
});

module.exports = router;
