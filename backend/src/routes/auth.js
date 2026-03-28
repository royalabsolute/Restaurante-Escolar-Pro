const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateLogin,
  validatePasswordReset,
  validatePasswordResetConfirm
} = require('../utils/validators');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Gestión de autenticación y usuarios
 */

// POST /api/auth/register - Registro de estudiante
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo estudiante
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *               - matricula
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               matricula:
 *                 type: string
 *     responses:
 *       201:
 *         description: Estudiante registrado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/register', validateUserRegistration, AuthController.register);

// POST /api/auth/login - Iniciar sesión
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email o matricula
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', validateLogin, AuthController.login);

// POST /api/auth/forgot-password - Solicitar recuperación de contraseña
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email de recuperación enviado
 */
router.post('/forgot-password', validatePasswordReset, AuthController.forgotPassword);

// POST /api/auth/reset-password - Confirmar recuperación de contraseña
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Confirmar recuperación de contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña restablecida exitosamente
 */
router.post('/reset-password', validatePasswordResetConfirm, AuthController.resetPassword);

// Rutas protegidas (requieren autenticación)

// GET /api/auth/me - Obtener información del usuario actual
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener información del usuario actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario
 *       401:
 *         description: No autorizado
 */
router.get('/me', authenticateToken, AuthController.getProfile);

// GET /api/auth/profile - Obtener perfil del usuario actual
router.get('/profile', authenticateToken, AuthController.getProfile);

// POST /api/auth/logout - Cerrar sesión
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Sesión cerrada
 */
router.post('/logout', authenticateToken, AuthController.logout);

module.exports = router;
