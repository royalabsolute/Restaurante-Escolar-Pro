/**
 * Rutas para gestión del QR único de suplente
 */
const express = require('express');
const router = express.Router();
const SuplenteQRController = require('../controllers/suplenteQRController');
const { authenticateToken, requireManagementRole, requireRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ========== RUTAS PARA ESCÁNER (escanear QR) ==========
// Acceso: escaner, docente, admin, secretaria, coordinador_convivencia
const requireScannerAccess = requireRole(['escaner', 'docente', 'admin', 'secretaria', 'coordinador_convivencia']);

// POST /api/suplente-qr/escanear - Registrar suplente vía QR
router.post('/escanear', requireScannerAccess, SuplenteQRController.escanearQR);

// GET /api/suplente-qr/conteo-hoy - Conteo de suplentes del día
router.get('/conteo-hoy', requireScannerAccess, SuplenteQRController.conteoHoy);

// ========== RUTAS DE GESTIÓN (admin/secretaria/coordinador) ==========

// POST /api/suplente-qr/generar - Generar nuevo QR
router.post('/generar', requireManagementRole, SuplenteQRController.generarQR);

// POST /api/suplente-qr/regenerar - Regenerar QR (invalida anterior)
router.post('/regenerar', requireManagementRole, SuplenteQRController.regenerarQR);

// GET /api/suplente-qr/activo - Obtener QR activo
router.get('/activo', requireManagementRole, SuplenteQRController.obtenerQRActivo);

// GET /api/suplente-qr/historial - Historial de conteos
router.get('/historial', requireManagementRole, SuplenteQRController.historial);

module.exports = router;
