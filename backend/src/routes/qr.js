const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Validar QR y registrar asistencia
router.post('/validate-attendance',
  requireRole(['admin', 'secretaria', 'docente', 'escaner', 'alfabetizador']),
  qrController.validateQRAndRegisterAttendance
);

// Generar QR para un estudiante específico
router.post('/generate/:id',
  requireRole(['admin', 'secretaria']),
  qrController.generateStudentQR
);

// Obtener información de estudiante por código QR
router.get('/student/:codigo_qr',
  requireRole(['admin', 'secretaria', 'docente', 'escaner', 'alfabetizador']),
  qrController.getStudentByQR
);

module.exports = router;
