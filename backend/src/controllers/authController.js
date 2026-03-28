const authService = require('../services/authService');
const logger = require('../utils/logger');

class AuthController {
  // Login
  static async login(req, res) {
    try {
      logger.api.request(req);
      const { email_or_matricula, password } = req.body;

      if (!email_or_matricula || !password) {
        return res.error('Email/matrícula y contraseña son requeridos', 400);
      }

      try {
        const user = await authService.validateLogin(email_or_matricula, password);
        const token = authService.generateToken(user);
        const additionalInfo = await authService.getAdditionalInfo(user);

        if (user.rol === 'alfabetizador') {
          await authService.createAlfabetizadorSession(user.id);
        }

        logger.auth.login(user, req.ip);

        return res.success({
          token,
          user: {
            id: user.id,
            email: user.email,
            rol: user.rol,
            access_config: user.access_config,
            expires_at: user.expires_at,
            ...additionalInfo
          }
        }, 'Login exitoso');

      } catch (authError) {
        if (authError.type === 'USER_NOT_FOUND' || authError.type === 'INVALID_PASSWORD') {
          logger.auth.failed(email_or_matricula, req.ip, authError.message);
          return res.error('Credenciales inválidas', 401);
        }
        if (authError.status) {
          return res.error(authError.message, authError.status);
        }
        throw authError;
      }
    } catch (error) {
      logger.api.error(req, error);
      return res.error('Error interno del servidor', 500);
    }
  }

  // Registro con Transacciones SQL
  static async register(req, res) {
    try {
      logger.api.request(req);
      const data = req.body;

      if (!data.email || !data.matricula || !data.password || !data.nombre || !data.apellidos) {
        return res.error('Campos requeridos faltantes', 400);
      }

      const result = await authService.registerStudent(data, req.get('Origin'));

      logger.auth.register({ id: result.userId, email: result.email, rol: 'estudiante' });

      return res.success({
        usuario_id: result.userId,
        estudiante_id: result.estudianteId,
        email: result.email,
        codigo_qr: result.qr
      }, 'Registro exitoso.', 201);

    } catch (error) {
      if (error.status) {
        return res.error(error.message, error.status);
      }
      logger.error('Error registro:', error);
      return res.error('Error en registro', 500);
    }
  }

  // Perfil
  static async getProfile(req, res) {
    try {
      const data = await authService.getProfileData(req.user.id);
      return res.success(data);
    } catch (error) {
      if (error.status) return res.error(error.message, error.status);
      logger.error('Error perfil:', error);
      return res.error('Error servidor', 500);
    }
  }

  static async logout(req, res) {
    try {
      if (req.user && req.user.rol === 'alfabetizador') {
        await authService.closeAlfabetizadorSession(req.user.id);
      }
      return res.success(null, 'Bye!');
    } catch (error) {
      return res.error('Error logout', 500);
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      await authService.requestPasswordReset(email);
      return res.success(null, 'Si existe, se envió código.');
    } catch (error) {
      logger.error('Error forgotPwd:', error);
      return res.error('Error', 500);
    }
  }

  static async resetPassword(req, res) {
    try {
      const { email, code, newPassword } = req.body;
      await authService.resetPassword(email, code, newPassword);
      return res.success(null, 'Listo');
    } catch (error) {
      if (error.status) return res.error(error.message, error.status);
      return res.error('Error reset', 500);
    }
  }
}

module.exports = AuthController;
