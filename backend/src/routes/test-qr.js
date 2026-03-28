const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Endpoint de prueba simple (sin autenticación)
router.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Test QR API funcionando correctamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// Obtener todos los estudiantes de prueba con sus QR (temporal sin autenticación)
router.get('/test-students', async (req, res) => {
  try {
    console.log('🔍 Obteniendo estudiantes de prueba...');
    
    const students = await db.query(`
      SELECT 
        e.id,
        e.nombre,
        e.apellidos,
        e.grado,
        e.codigo_qr,
        e.prioridad,
        e.grupo_etnico,
        e.es_desplazado,
        e.qr_usado,
        u.email
      FROM estudiantes e
      INNER JOIN usuarios u ON e.usuario_id = u.id
      WHERE e.nombre LIKE 'Prueba %'
      ORDER BY CAST(SUBSTRING(e.nombre, 8) AS UNSIGNED)
    `);

    res.json({
      success: true,
      data: students,
      total: students.length
    });

  } catch (error) {
    console.error('Error al obtener estudiantes de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Resetear todos los QR de prueba (temporal sin autenticación) - DEBE IR ANTES que la ruta con :id
router.patch('/test-students/reset-all', async (req, res) => {
  try {
    console.log('🔄 Reseteando todos los QR de prueba...');
    
    await db.query(`
      UPDATE estudiantes 
      SET qr_usado = FALSE 
      WHERE nombre LIKE 'Prueba %'
    `);

    res.json({
      success: true,
      message: 'Todos los QR de prueba han sido reseteados'
    });

  } catch (error) {
    console.error('Error al resetear QR:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Marcar QR como usado (temporal sin autenticación) - DEBE IR DESPUÉS de rutas específicas
router.patch('/test-students/:id/mark-used', async (req, res) => {
  try {
    console.log('🔄 Marcando QR como usado, ID:', req.params.id);
    
    const { id } = req.params;

    // Agregar campo qr_usado si no existe
    try {
      await db.query(`
        ALTER TABLE estudiantes 
        ADD COLUMN IF NOT EXISTS qr_usado BOOLEAN DEFAULT FALSE
      `);
    } catch (alterError) {
      // La columna ya existe, continuar
    }

    // Marcar como usado
    await db.query(`
      UPDATE estudiantes 
      SET qr_usado = TRUE 
      WHERE id = ? AND nombre LIKE 'Prueba %'
    `, [id]);

    res.json({
      success: true,
      message: 'QR marcado como usado'
    });

  } catch (error) {
    console.error('Error al marcar QR como usado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar todos los estudiantes de prueba (temporal sin autenticación)
router.delete('/test-students/delete-all', async (req, res) => {
  try {
    console.log('🗑️ Eliminando todos los estudiantes de prueba...');
    
    // Eliminar acudientes de estudiantes de prueba
    await db.query(`
      DELETE a FROM acudientes a
      INNER JOIN estudiantes e ON a.estudiante_id = e.id
      WHERE e.nombre LIKE 'Prueba %'
    `);

    // Eliminar estudiantes de prueba
    await db.query(`
      DELETE e FROM estudiantes e
      WHERE e.nombre LIKE 'Prueba %'
    `);

    // Eliminar usuarios de prueba
    await db.query(`
      DELETE FROM usuarios 
      WHERE email LIKE '%@prueba.com'
    `);

    res.json({
      success: true,
      message: 'Todos los estudiantes de prueba han sido eliminados'
    });

  } catch (error) {
    console.error('Error al eliminar estudiantes de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
