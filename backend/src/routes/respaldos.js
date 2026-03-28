const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const RespaldoController = require('../controllers/respaldoController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const uploadDir = path.join(os.tmpdir(), 'restaurante-respaldos');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// Todas las rutas requieren autenticación de admin
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/respaldos - Listar todos los respaldos
router.get('/', RespaldoController.listarRespaldos);

// GET /api/respaldos/estadisticas - Obtener estadísticas
router.get('/estadisticas', RespaldoController.obtenerEstadisticas);

// POST /api/respaldos/crear/sql - Crear respaldo SQL
router.post('/crear/sql', RespaldoController.crearRespaldoSQL);

// POST /api/respaldos/crear/csv - Crear respaldo CSV
router.post('/crear/csv', RespaldoController.crearRespaldoCSV);

// GET /api/respaldos/descargar/:nombre - Descargar respaldo
router.get('/descargar/:nombre', RespaldoController.descargarRespaldo);

// POST /api/respaldos/restaurar - Restaurar base de datos
router.post('/restaurar', upload.single('archivo'), RespaldoController.restaurarRespaldo);

// POST /api/respaldos/vaciar - Vaciar toda la base de datos
router.post('/vaciar', RespaldoController.vaciarBaseDatos);

// DELETE /api/respaldos/:nombre - Eliminar respaldo
router.delete('/:nombre', RespaldoController.eliminarRespaldo);

module.exports = router;
