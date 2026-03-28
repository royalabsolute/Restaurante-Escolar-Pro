#!/usr/bin/env node

/**
 * Script para generar secretos seguros para JWT y configuración
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generateSecurePassword(length = 16) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

function updateEnvFile(envPath, replacements) {
  if (!fs.existsSync(envPath)) {
    console.log(`❌ Archivo ${envPath} no encontrado`);
    return false;
  }

  let content = fs.readFileSync(envPath, 'utf8');
  
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
      console.log(`✅ Actualizado ${key} en ${path.basename(envPath)}`);
    } else {
      console.log(`⚠️  Variable ${key} no encontrada en ${path.basename(envPath)}`);
    }
  }

  fs.writeFileSync(envPath, content);
  return true;
}

function main() {
  console.log('🔐 Generando secretos seguros para el sistema...\n');

  // Generar secretos
  const jwtSecret = generateSecureSecret(64);
  const jwtRefreshSecret = generateSecureSecret(64);
  const dbPassword = generateSecurePassword(20);

  console.log('🎲 Secretos generados:');
  console.log(`   JWT Secret: ${jwtSecret.substring(0, 16)}...`);
  console.log(`   JWT Refresh Secret: ${jwtRefreshSecret.substring(0, 16)}...`);
  console.log(`   DB Password: ${dbPassword.substring(0, 8)}...\n`);

  // Rutas de archivos de entorno
  const productionEnvPath = path.join(__dirname, '..', '.env.production');
  const developmentEnvPath = path.join(__dirname, '..', '.env.development');
  const currentEnvPath = path.join(__dirname, '..', '.env');

  // Valores a actualizar
  const productionReplacements = {
    'JWT_SECRET': jwtSecret,
    'JWT_REFRESH_SECRET': jwtRefreshSecret,
    'DB_PASSWORD': dbPassword
  };

  const developmentReplacements = {
    'JWT_SECRET': jwtSecret + '_dev',
    'JWT_REFRESH_SECRET': jwtRefreshSecret + '_dev'
  };

  // Actualizar archivos
  console.log('📝 Actualizando archivos de configuración:');
  
  if (updateEnvFile(productionEnvPath, productionReplacements)) {
    console.log('✅ Archivo .env.production actualizado');
  }

  if (updateEnvFile(developmentEnvPath, developmentReplacements)) {
    console.log('✅ Archivo .env.development actualizado');
  }

  // Actualizar .env actual (desarrollo)
  if (fs.existsSync(currentEnvPath)) {
    if (updateEnvFile(currentEnvPath, developmentReplacements)) {
      console.log('✅ Archivo .env actual actualizado');
    }
  }

  console.log('\n🎉 ¡Secretos generados y configurados exitosamente!');
  console.log('\n📋 Próximos pasos:');
  console.log('   1. Para desarrollo: usar .env.development');
  console.log('   2. Para producción: copiar .env.production a .env');
  console.log('   3. En producción, configurar también:');
  console.log('      - EMAIL_USER y EMAIL_PASSWORD');
  console.log('      - FRONTEND_URL');
  console.log('      - ALLOWED_ORIGINS');
  console.log('\n⚠️  IMPORTANTE: ¡Nunca compartir estos secretos públicamente!');

  // Crear archivo de respaldo de los secretos (opcional)
  const secretsBackup = {
    generated_at: new Date().toISOString(),
    jwt_secret: jwtSecret,
    jwt_refresh_secret: jwtRefreshSecret,
    db_password: dbPassword,
    note: 'Respaldo de secretos generados - MANTENER SEGURO'
  };

  const backupPath = path.join(__dirname, '..', 'secrets-backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(secretsBackup, null, 2));
  console.log(`\n💾 Respaldo de secretos guardado en: ${path.basename(backupPath)}`);
  console.log('   (Eliminar este archivo después de configurar producción)');
}

if (require.main === module) {
  main();
}

module.exports = {
  generateSecureSecret,
  generateSecurePassword,
  updateEnvFile
};