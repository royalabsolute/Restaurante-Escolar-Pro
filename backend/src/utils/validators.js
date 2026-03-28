const { body, validationResult } = require('express-validator');

/**
 * Middleware para manejar los errores de validación de express-validator
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Si res.validation existe (del middleware standardResponse), lo usamos
        if (res.validation) {
            return res.validation(errors.array().map(err => ({
                field: err.path,
                message: err.msg
            })));
        }
        // Si no, respuesta simple
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array()
        });
    }
    next();
};

/**
 * Validaciones para registro de usuario
 */
const validateUserRegistration = [
    body('email').isEmail().withMessage('El email no es válido').normalizeEmail(),
    body('matricula').notEmpty().withMessage('La matrícula es requerida'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('apellidos').notEmpty().withMessage('Los apellidos son requeridos'),
    handleValidationErrors
];

/**
 * Validaciones para login
 */
const validateLogin = [
    body('email_or_matricula').notEmpty().withMessage('El email o matrícula es requerido'),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
    handleValidationErrors
];

/**
 * Validaciones para solicitar recuperación de contraseña
 */
const validatePasswordReset = [
    body('email').isEmail().withMessage('El email no es válido').normalizeEmail(),
    handleValidationErrors
];

/**
 * Validaciones para confirmar recuperación de contraseña
 */
const validatePasswordResetConfirm = [
    body('email').isEmail().withMessage('El email no es válido').normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }).withMessage('El código debe tener 6 dígitos'),
    body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
    handleValidationErrors
];

module.exports = {
    validateUserRegistration,
    validateLogin,
    validatePasswordReset,
    validatePasswordResetConfirm
};
