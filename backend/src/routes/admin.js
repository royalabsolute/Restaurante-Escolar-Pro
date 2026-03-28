const express = require('express');
const AdminController = require('../controllers/adminController');
const AdminUserController = require('../controllers/AdminUserController');
const AdminStudentController = require('../controllers/AdminStudentController');
const GruposController = require('../controllers/GruposController');

const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadProfilePhoto, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticateToken);
router.use(requireAdmin);

// ========== DASHBOARD STATS ==========
router.get('/dashboard-stats', AdminController.getDashboardStats);
router.get('/attendance-today', AdminController.getAttendanceToday);

// ========== GRUPOS ACADÉMICOS ==========
router.get('/grupos', GruposController.getAllGrupos);
router.post('/grupos', GruposController.createGrupo);
router.put('/grupos/:id', GruposController.updateGrupo);
router.put('/grupos/:id/reassign', GruposController.reassignStudents);
router.delete('/grupos/:id', GruposController.deleteGrupo);

// ========== DOCENTES & ALFABETIZADORES ==========
router.get('/docentes', GruposController.getDocentes);
router.get('/alfabetizadores', (req, res) => {
  req.query.rol = 'alfabetizador';
  return AdminStudentController.getStudentsByStatus(req, res);
});

// ========== BÚSQUEDA OPTIMIZADA ==========
router.get('/users/search', AdminUserController.searchUsers);

// ========== CRUD DE USUARIOS ==========
router.get('/users', AdminUserController.getAllUsers);
router.get('/users/:userId', AdminUserController.getUserById);
router.put('/users/:userId', AdminUserController.updateUser);
router.post(
  '/users/:userId/photo',
  (req, res, next) => {
    uploadProfilePhoto(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      next();
    });
  },
  AdminUserController.uploadUserPhoto
);
router.delete('/users/:userId', AdminUserController.deleteUser);
router.post('/usuarios/crear-completo', AdminUserController.crearUsuarioCompleto);

// ========== GESTIÓN DE ESTUDIANTES ==========
router.get('/students', AdminStudentController.getStudentsByStatus);
router.get('/students/:studentId/complete', AdminStudentController.getStudentComplete);
router.put('/students/:studentId/validate', AdminStudentController.validateStudent);
router.put('/students/:studentId/reject', AdminStudentController.rejectStudent);

// ========== GESTIÓN MASIVA ==========
router.post('/reset-all-passwords', AdminStudentController.resetAllPasswords);
router.post('/regenerate-all-barcodes', AdminStudentController.regenerateAllBarcodes);

// ========== GESTIÓN DE BASE DE DATOS & EXPORT ==========
router.get('/export/students', AdminStudentController.exportStudentsData);
router.get('/export/config', AdminController.exportDatabaseConfig);
router.post('/cleanup-audit', AdminController.cleanupAuditoria);

// ========== JUSTIFICACIONES (Proxied or specialized) ==========
router.get('/justifications', async (req, res) => {
  try {
    const Justification = require('../models/Justification');
    const { sendSuccess } = require('../middleware/standardResponse');
    const justifications = await Justification.findAll();
    return sendSuccess(res, justifications);
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

router.put('/justifications/:justificationId/approve', async (req, res) => {
  try {
    const justificacionesController = require('../controllers/justificacionesController');
    req.params.id = req.params.justificationId;
    await justificacionesController.aprobar(req, res);
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

router.put('/justifications/:justificationId/reject', async (req, res) => {
  try {
    const justificacionesController = require('../controllers/justificacionesController');
    req.params.id = req.params.justificationId;
    await justificacionesController.rechazar(req, res);
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

router.delete('/justifications/:justificationId', async (req, res) => {
  try {
    const Justification = require('../models/Justification');
    const { sendSuccess } = require('../middleware/standardResponse');
    await Justification.delete(req.params.justificationId);
    return sendSuccess(res, null, 'Justificación eliminada');
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// ========== AUDITORÍA ==========
router.get('/audit-log', async (req, res) => {
  try {
    const database = require('../config/database');
    const { sendSuccess } = require('../middleware/standardResponse');
    const logs = await database.query(`
      SELECT a.*, u.email as usuario_email 
      FROM auditoria a 
      LEFT JOIN usuarios u ON a.usuario_id = u.id 
      ORDER BY a.fecha_accion DESC LIMIT 200
    `);
    return sendSuccess(res, logs);
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

module.exports = router;
