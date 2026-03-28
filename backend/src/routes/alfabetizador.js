const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Middleware específico para Alfabetizador
const requireAlfabetizador = requireRole(['alfabetizador', 'admin']);

/**
 * @swagger
 * /api/alfabetizador/scan:
 *   post:
 *     summary: Escanear QR (Estudiante o Suplente Universal)
 *     tags: [Alfabetizador]
 */
router.post('/scan', authenticateToken, requireAlfabetizador, qrController.validateQRAndRegisterAttendance);

/**
 * @swagger
 * /api/alfabetizador/suplente-registro:
 *   post:
 *     summary: Registro manual de suplente (incremento de contador)
 *     tags: [Alfabetizador]
 */
router.post('/suplente-registro', authenticateToken, requireAlfabetizador, async (req, res) => {
    // Forzar el código de QR universal para registro manual
    req.body.codigo_qr = process.env.GLOBAL_SUPLENTE_ID || 'SUPLENTE_UNIVERSAL_QR_2026';
    return qrController.validateQRAndRegisterAttendance(req, res);
});

module.exports = router;
