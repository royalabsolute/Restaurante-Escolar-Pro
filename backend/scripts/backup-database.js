const database = require('../src/config/database');
const fs = require('fs');
const path = require('path');

/**
 * Script para realizar respaldo de la base de datos
 * Ejecutar con: node scripts/backup-database.js
 */

async function backupDatabase() {
  try {
    console.log('🚀 Iniciando respaldo de base de datos...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');
    
    // Crear directorio de respaldos si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);
    
    // Obtener información de configuración
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'restaurante_escolar_db'
    };
    
    // Comando mysqldump
    const { spawn } = require('child_process');
    const mysqldump = spawn('mysqldump', [
      '-h', dbConfig.host,
      '-P', dbConfig.port,
      '-u', dbConfig.user,
      dbConfig.password ? `-p${dbConfig.password}` : '',
      '--routines',
      '--triggers',
      '--single-transaction',
      dbConfig.database
    ].filter(Boolean));
    
    const writeStream = fs.createWriteStream(backupFile);
    mysqldump.stdout.pipe(writeStream);
    
    mysqldump.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Respaldo completado: ${backupFile}`);
        
        // Registrar en log de respaldos
        const logFile = path.join(backupDir, 'backup_log.txt');
        const logEntry = `${new Date().toISOString()} - Respaldo exitoso: ${path.basename(backupFile)}\n`;
        fs.appendFileSync(logFile, logEntry);
        
        // Limpiar respaldos antiguos (mantener solo los últimos 10)
        cleanOldBackups(backupDir);
      } else {
        console.error('❌ Error en el respaldo, código:', code);
      }
    });
    
    mysqldump.on('error', (error) => {
      console.error('❌ Error ejecutando mysqldump:', error.message);
      console.log('💡 Asegúrate de tener mysqldump instalado y configurado en PATH');
    });
    
  } catch (error) {
    console.error('❌ Error en respaldo:', error.message);
  }
}

function cleanOldBackups(backupDir) {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    // Mantener solo los últimos 10 respaldos
    if (files.length > 10) {
      const filesToDelete = files.slice(10);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Respaldo antiguo eliminado: ${file.name}`);
      });
    }
  } catch (error) {
    console.warn('⚠️  Error limpiando respaldos antiguos:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  backupDatabase();
}

module.exports = { backupDatabase };
