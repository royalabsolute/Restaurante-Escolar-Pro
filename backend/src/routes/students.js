const express = require('express');
const StudentController = require('../controllers/studentController');
const {
  authenticateToken,
  requireStudent,
  requireTeacherOrAdmin,
  requireSecretaryOrAdmin,
  requireScannerAccess
} = require('../middleware/auth');
const { uploadProfilePhoto, uploadJustificationFile, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// ========== RUTAS EXCLUSIVAS PARA ESTUDIANTES ==========

// GET /api/students/my-profile - Obtener mi perfil (solo estudiantes)
router.get('/my-profile', authenticateToken, requireStudent, StudentController.getMyProfile);

// PUT /api/students/my-profile - Actualizar mi perfil (solo estudiantes)
router.put('/my-profile', authenticateToken, requireStudent, StudentController.updateMyProfile);

// POST /api/students/upload-photo - Subir foto de perfil (solo estudiantes)
router.post('/upload-photo', authenticateToken, requireStudent, uploadProfilePhoto, StudentController.uploadProfilePhoto);

// POST /api/students/generate-qr - Generar nuevo código QR (solo estudiantes)
router.post('/generate-qr', authenticateToken, requireStudent, StudentController.generateMyQR);

// GET /api/students/my-attendance - Obtener mis asistencias (solo estudiantes)
router.get('/my-attendance', authenticateToken, requireStudent, StudentController.getMyAttendance);

// GET /api/students/my-justifications - Obtener mis justificaciones (solo estudiantes)
router.get('/my-justifications', authenticateToken, requireStudent, StudentController.getMyJustifications);

// POST /api/students/justifications - Crear justificación (solo estudiantes)
router.post(
  '/justifications',
  authenticateToken,
  requireStudent,
  uploadJustificationFile,
  handleMulterError,
  StudentController.createJustification
);

// ========== RUTAS EXCLUSIVAS PARA DOCENTES/ALFABETIZADORES/ADMIN ==========

// GET /api/students - Obtener estudiantes validados (docentes/alfabetizadores/admin)
router.get('/', authenticateToken, requireTeacherOrAdmin, StudentController.getAllStudents);

// GET /api/students/search - Buscar estudiantes (docentes/alfabetizadores/admin)
router.get('/search', authenticateToken, requireTeacherOrAdmin, StudentController.searchStudents);

// GET /api/students/barcode/:barcode - Buscar por código QR (docentes/alfabetizadores/admin)
router.get('/barcode/:barcode', authenticateToken, requireTeacherOrAdmin, StudentController.findByBarcode);

// POST /api/students/attendance - Registrar asistencia (docentes/alfabetizadores/admin)
router.post('/attendance', authenticateToken, requireTeacherOrAdmin, StudentController.registerAttendance);

// ✅ NUEVO: POST /api/students/attendance/reject - Rechazar asistencia (docentes/alfabetizadores/admin)
router.post('/attendance/reject', authenticateToken, requireTeacherOrAdmin, StudentController.rejectAttendance);

// GET /api/students/attendance/today - Ver asistencias del día (admin/secretaria/escaner/docente)
router.get('/attendance/today', authenticateToken, requireScannerAccess, StudentController.getTodayAttendance);

// GET /api/students/stats/today - Estadísticas básicas del día (docentes/alfabetizadores/admin)
router.get('/stats/today', authenticateToken, requireTeacherOrAdmin, StudentController.getTodayStats);


// GET /api/students/historial-completo - Historial completo con estadísticas
router.get('/historial-completo', authenticateToken, requireTeacherOrAdmin, StudentController.getHistorialCompleto);

// GET /api/students/:id/reportes-detalle - Drill-down detallado por estudiante (solo secretaria/admin)
router.get('/:id/reportes-detalle', authenticateToken, requireSecretaryOrAdmin, StudentController.getStudentReportDetail);

// GET /api/students/find-by-code/:codigo - Buscar estudiante por código QR o matrícula
router.get('/find-by-code/:codigo', authenticateToken, requireTeacherOrAdmin, StudentController.findStudentByCode);

// ✅ NUEVO: Rutas para suplentes (alfabetizadores)
router.get('/suplentes', authenticateToken, requireTeacherOrAdmin, StudentController.getSuplentes);
router.get('/suplentes-con-estadisticas', authenticateToken, requireTeacherOrAdmin, StudentController.getSuplentesConEstadisticas);

module.exports = router;
