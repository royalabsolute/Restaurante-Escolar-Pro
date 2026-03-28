const mysql = require('mysql2/promise');
const logger = require('../utils/logger');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurante_escolar_db',
  charset: 'utf8mb4',
  timezone: 'local'
};

class Database {
  constructor() {
    this.pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 50,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    });
  }

  async query(sql, params = []) {
    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      logger.error('Error en consulta de base de datos:', { error: error.message, sql: sql.substring(0, 500) });
      throw error;
    }
  }

  async getConnection() {
    return await this.pool.getConnection();
  }

  async testConnection() {
    try {
      const connection = await this.getConnection();
      logger.info('Conexión a la base de datos exitosa');
      connection.release();
      return true;
    } catch (error) {
      logger.error('Error de conexión a la base de datos:', { error: error.message });
      return false;
    }
  }
}

module.exports = new Database();