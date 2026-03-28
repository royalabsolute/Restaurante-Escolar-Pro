const bcrypt = require('bcrypt');
const database = require('../config/database');

let tableInitialized = false;

const ensureTable = async () => {
  if (tableInitialized) {
    return;
  }

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS password_reset_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      code_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      consumed TINYINT(1) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_expires (user_id, expires_at),
      CONSTRAINT fk_password_reset_codes_user FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await database.query(createTableSQL);
  tableInitialized = true;
};

class PasswordResetCode {
  static async createForUser(userId, code, ttlMinutes = 15) {
    await ensureTable();

    // Invalidate previous pending codes for this user
    await database.query(
      'UPDATE password_reset_codes SET consumed = 1 WHERE user_id = ? AND consumed = 0',
      [userId]
    );

    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await database.query(
      'INSERT INTO password_reset_codes (user_id, code_hash, expires_at, consumed) VALUES (?, ?, ?, 0)',
      [userId, codeHash, expiresAt]
    );

    return {
      code,
      expiresAt
    };
  }

  static async findValidCode(userId) {
    await ensureTable();

    const codes = await database.query(
      `SELECT * FROM password_reset_codes
       WHERE user_id = ? AND consumed = 0 AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    return codes;
  }

  static async verifyCode(userId, code) {
    const codes = await PasswordResetCode.findValidCode(userId);

    for (const record of codes) {
      const matches = await bcrypt.compare(code, record.code_hash);
      if (matches) {
        return record;
      }
    }

    return null;
  }

  static async consumeCode(recordId) {
    await ensureTable();

    await database.query(
      'UPDATE password_reset_codes SET consumed = 1 WHERE id = ?',
      [recordId]
    );
  }
}

module.exports = PasswordResetCode;
