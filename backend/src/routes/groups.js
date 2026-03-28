const express = require('express');
const router = express.Router();
const GruposController = require('../controllers/GruposController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Obtener lista de grupos académicos
 *     tags: [Grupos]
 *     responses:
 *       200:
 *         description: Lista de grupos
 */
router.get('/', GruposController.getPublicGrupos);

/**
 * @swagger
 * /api/groups/admin:
 *   get:
 *     summary: Obtener lista completa de grupos (admin)
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin', authenticateToken, GruposController.getAllGrupos);

module.exports = router;
