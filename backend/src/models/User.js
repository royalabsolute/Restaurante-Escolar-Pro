const database = require('../config/database');
const bcrypt = require('bcrypt');
const { mapArrayToFrontend } = require('../utils/jornadaMapper');

class User {
  // Crear nuevo usuario
  static async create(userData) {
    const { email, matricula, password, rol } = userData;

    // Hash de la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await database.query(
      `INSERT INTO usuarios (email, matricula, password, rol, estado) 
       VALUES (?, ?, ?, ?, ?)`,
      [email, matricula, hashedPassword, rol, 'pendiente']
    );

    return {
      id: result.insertId,
      email,
      matricula,
      rol,
      estado: 'pendiente'
    };
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const users = await database.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    return users[0] || null;
  }

  // Buscar usuario por matrícula
  static async findByMatricula(matricula) {
    const users = await database.query(
      'SELECT * FROM usuarios WHERE matricula = ?',
      [matricula]
    );
    return users[0] || null;
  }

  // Buscar usuario por ID
  static async findById(id) {
    const users = await database.query(
      'SELECT id, email, matricula, rol, estado, fecha_registro, ultimo_login, expires_at, access_config FROM usuarios WHERE id = ?',
      [id]
    );
    return users[0] || null;
  }

  // Verificar contraseña
  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Actualizar último login
  static async updateLastLogin(userId) {
    await database.query(
      'UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?',
      [userId]
    );
  }

  // Cambiar estado del usuario
  static async updateStatus(userId, status) {
    const validStatuses = ['pendiente', 'validado', 'rechazado', 'suspendido'];
    if (!validStatuses.includes(status)) {
      throw new Error('Estado inválido');
    }

    await database.query(
      'UPDATE usuarios SET estado = ? WHERE id = ?',
      [status, userId]
    );
  }

  // Cambiar estado del usuario con motivo de rechazo
  static async updateStatusWithReason(userId, status, motivo) {
    const validStatuses = ['pendiente', 'validado', 'rechazado', 'suspendido'];
    if (!validStatuses.includes(status)) {
      throw new Error('Estado inválido');
    }

    // Elegir la columna correcta según el estado
    const motivoColumn = status === 'suspendido' ? 'motivo_suspension' : 'motivo_rechazo';

    await database.query(
      `UPDATE usuarios SET estado = ?, ${motivoColumn} = ? WHERE id = ?`,
      [status, motivo, userId]
    );
  }

  // Obtener usuarios por estado
  static async findByStatus(status) {
    const users = await database.query(
      `SELECT u.id, u.email, u.matricula, u.rol, u.estado, u.fecha_registro,
              e.nombre, e.apellidos, g.nombre AS grado, e.estrato
       FROM usuarios u
       LEFT JOIN estudiantes e ON u.id = e.usuario_id
       LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
       WHERE u.estado = ?
       ORDER BY e.estrato ASC, u.fecha_registro ASC`,
      [status]
    );
    return users;
  }

  // Obtener usuarios por estado y roles específicos
  static async findByStatusAndRoles(status, allowedRoles) {
    const placeholders = allowedRoles.map(() => '?').join(',');
    const users = await database.query(
      `SELECT u.id as usuario_id, u.email, u.matricula, u.rol, u.estado, u.fecha_registro,
              e.id, 
              COALESCE(e.nombre, SUBSTRING_INDEX(u.email, '@', 1)) as nombre, 
              COALESCE(e.apellidos, '') as apellidos, 
              g.nombre AS grado, e.estrato,
              u.motivo_rechazo, u.motivo_suspension
       FROM usuarios u
       LEFT JOIN estudiantes e ON u.id = e.usuario_id
       LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
       WHERE u.estado = ? AND u.rol IN (${placeholders})
       ORDER BY e.estrato ASC, u.fecha_registro ASC`,
      [status, ...allowedRoles]
    );
    return users;
  }

  // Obtener todos los usuarios (para admin)
  static async findAll() {
    const users = await database.query(
      `SELECT u.id, u.email, u.matricula, u.rol, u.estado, u.fecha_registro, u.ultimo_login,
              e.nombre, e.apellidos, g.nombre AS grado, g.jornada, e.estrato, e.telefono,
              e.codigo_qr, e.foto_perfil, e.grupo_etnico, e.es_desplazado, e.fecha_nacimiento, e.prioridad
       FROM usuarios u
       LEFT JOIN estudiantes e ON u.id = e.usuario_id
       LEFT JOIN grupos_academicos g ON e.grupo_academico_id = g.id
       ORDER BY u.fecha_registro DESC`
    );

    // Mapear la jornada de la base de datos (mal codificada) al frontend (correcta)
    return mapArrayToFrontend(users);
  }

  // Eliminar usuario
  static async delete(userId) {
    await database.query('DELETE FROM usuarios WHERE id = ?', [userId]);
  }

  // Cambiar contraseña
  static async updatePassword(userId, newPassword) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await database.query(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
  }

  // Generar token de recuperación
  static async generateResetToken(email) {
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const expirationTime = new Date(Date.now() + 3600000); // 1 hora

    await database.query(
      'UPDATE usuarios SET token_recuperacion = ?, token_expiracion = ? WHERE email = ?',
      [resetToken, expirationTime, email]
    );

    return resetToken;
  }

  // Verificar token de recuperación
  static async verifyResetToken(token) {
    const users = await database.query(
      'SELECT id, email FROM usuarios WHERE token_recuperacion = ? AND token_expiracion > NOW()',
      [token]
    );
    return users[0] || null;
  }

  // Limpiar token de recuperación
  static async clearResetToken(userId) {
    await database.query(
      'UPDATE usuarios SET token_recuperacion = NULL, token_expiracion = NULL WHERE id = ?',
      [userId]
    );
  }
}

module.exports = User;
