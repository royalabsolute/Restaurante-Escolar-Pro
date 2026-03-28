const express = require('express');
const SecretaryController = require('../controllers/secretaryController');
const AdminUserController = require('../controllers/AdminUserController');
const GruposController = require('../controllers/GruposController');
const { authenticateToken, requireManagementRole } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación y rol de secretaria o admin
router.use(authenticateToken);
router.use(requireManagementRole);

// ========== GRUPOS ACADÉMICOS (solo lectura para Secretaría/Coordinador) ==========
router.get('/grupos', GruposController.getAllGrupos);
router.get('/docentes', GruposController.getDocentes);

// ========== BÚSQUEDA OPTIMIZADA ==========

// GET /api/secretary/users/search - Búsqueda optimizada con paginación
router.get('/users/search', SecretaryController.searchUsers);

// ========== RUTAS DE ESTUDIANTES ==========

// GET /api/secretary/users - TODOS los usuarios (excepto admin y QR prueba)
router.get('/users', SecretaryController.getAllUsers);

// GET /api/secretary/students/pending - Estudiantes pendientes de validación
router.get('/students/pending', SecretaryController.getPendingStudents);

// GET /api/secretary/students/validated - Estudiantes validados
router.get('/students/validated', SecretaryController.getValidatedStudents);

// GET /api/secretary/students/rejected - Estudiantes rechazados
router.get('/students/rejected', SecretaryController.getRejectedStudents);

// GET /api/secretary/students/suspended - Estudiantes suspendidos
router.get('/students/suspended', SecretaryController.getSuspendedStudents);

// GET /api/secretary/students/:studentId - Obtener estudiante por ID con toda su información
router.get('/students/:studentId', SecretaryController.getStudentById);

// PUT /api/secretary/students/:studentId/validate - Validar/Rechazar estudiante
router.put('/students/:studentId/validate', SecretaryController.validateStudent);

// PUT /api/secretary/students/:studentId - Actualizar información de estudiante
router.put('/students/:studentId', SecretaryController.updateStudent);

// PUT /api/secretary/students/:studentId/suspend - Suspender estudiante
router.put('/students/:studentId/suspend', SecretaryController.suspendStudent);

// POST /api/secretary/students/:studentId/reset-password - Reiniciar contraseña
router.post('/students/:studentId/reset-password', SecretaryController.resetStudentPassword);

// POST /api/secretary/students - Crear un nuevo estudiante completamente (Secretaría/Coordinador)
router.post('/students', AdminUserController.crearUsuarioCompleto);

// ========== GESTIÓN DE JUSTIFICACIONES ==========

// GET /api/secretary/justifications/pending - Justificaciones pendientes
router.get('/justifications/pending', SecretaryController.getPendingJustifications);

// GET /api/secretary/justifications/approved - Justificaciones aprobadas
router.get('/justifications/approved', SecretaryController.getApprovedJustifications);

// GET /api/secretary/justifications/rejected - Justificaciones rechazadas
router.get('/justifications/rejected', SecretaryController.getRejectedJustifications);

// PUT /api/secretary/justifications/:justificationId/review - Revisar justificación
router.put('/justifications/:justificationId/review', SecretaryController.reviewJustification);

// PUT /api/secretary/justifications/:justificationId/approve - Aprobar justificación
router.put('/justifications/:justificationId/approve', async (req, res) => {
  try {
    const justificacionesController = require('../controllers/justificacionesController');
    req.params.id = req.params.justificationId;
    await justificacionesController.aprobar(req, res);
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// PUT /api/secretary/justifications/:justificationId/reject - Rechazar justificación
router.put('/justifications/:justificationId/reject', async (req, res) => {
  try {
    const justificacionesController = require('../controllers/justificacionesController');
    req.params.id = req.params.justificationId;
    await justificacionesController.rechazar(req, res);
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});


// ========== MENSAJERÍA ==========

// POST /api/secretary/students/:studentId/message - Enviar mensaje a estudiante
router.post('/students/:studentId/message', SecretaryController.sendMessageToStudent);

// POST /api/secretary/students/:studentId/notify-parent - Notificar acudiente
router.post('/students/:studentId/notify-parent', SecretaryController.notifyParent);

// ========== GESTIÓN DE FALTAS EXCESIVAS ==========

// POST /api/secretary/students/process-absences - Procesar ausencias y suspensiones automáticas
router.post('/students/process-absences', SecretaryController.processDailyAbsences);

// GET /api/secretary/students/excessive-absences - Estudiantes con muchas faltas
router.get('/students/excessive-absences', SecretaryController.getStudentsWithExcessiveAbsences);

// DELETE /api/secretary/students/:studentId/remove-for-absences - Eliminar por faltas
router.delete('/students/:studentId/remove-for-absences', SecretaryController.removeStudentForAbsences);

// ========== GESTIÓN DE QR (LIMITADA) ==========

// GET /api/secretary/qr/students - Obtener estudiantes para gestión de QR
router.get('/qr/students', SecretaryController.getStudentsForQR);

// POST /api/secretary/qr/generate/:studentId - Generar código QR para estudiante
router.post('/qr/generate/:studentId', SecretaryController.generateStudentQR);

module.exports = router;
