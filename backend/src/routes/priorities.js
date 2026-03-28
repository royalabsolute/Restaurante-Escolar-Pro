const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { authenticateToken } = require('../middleware/auth');

// Obtener estadísticas de prioridades (solo admin)
router.get('/priority-stats', authenticateToken, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Acceso denegado. Solo administradores pueden ver estas estadísticas.'
      });
    }

    const stats = await Student.getPriorityStats();
    
    res.json({
      status: 'SUCCESS',
      data: {
        priority_stats: stats,
        summary: {
          total_students: stats.reduce((sum, stat) => sum + stat.total_estudiantes, 0),
          validated_students: stats.reduce((sum, stat) => sum + stat.validados, 0),
          pending_students: stats.reduce((sum, stat) => sum + stat.pendientes, 0)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de prioridades:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estudiantes ordenados por prioridad
router.get('/by-priority', authenticateToken, async (req, res) => {
  try {
    // Verificar que sea admin o secretaria
    if (!['admin', 'secretaria'].includes(req.user.rol)) {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Acceso denegado.'
      });
    }

    const { status = 'validado' } = req.query;
    const students = await Student.findByStatus(status);
    
    res.json({
      status: 'SUCCESS',
      data: {
        students: students,
        total: students.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo estudiantes por prioridad:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
