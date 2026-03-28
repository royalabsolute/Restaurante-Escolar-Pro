/**
 * Migración: Agregar columna estudiantes_atendidos a sesiones_trabajo
 * Fecha: 2025-10-25
 * Propósito: Permitir registrar cuántos estudiantes atendió el alfabetizador en cada sesión
 */

const database = require('../src/config/database');

async function migrateUp() {
  try {
    console.log('🔄 Iniciando migración: add-estudiantes-atendidos-sesiones...');

    // 1. Verificar si la columna ya existe
    const columns = await database.query(`
      SHOW COLUMNS FROM sesiones_trabajo LIKE 'estudiantes_atendidos'
    `);

    if (columns.length > 0) {
      console.log('✅ La columna estudiantes_atendidos ya existe. Migración no necesaria.');
      return;
    }

    // 2. Agregar la columna estudiantes_atendidos
    await database.query(`
      ALTER TABLE sesiones_trabajo
      ADD COLUMN estudiantes_atendidos INT DEFAULT 0 AFTER total_horas
    `);

    console.log('✅ Columna estudiantes_atendidos agregada exitosamente');

    // 3. Crear índice para mejorar consultas
    await database.query(`
      CREATE INDEX idx_sesiones_usuario_fecha 
      ON sesiones_trabajo(usuario_id, fecha)
    `);

    console.log('✅ Índice creado para optimizar consultas');

    console.log('✅ Migración completada exitosamente!');
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    throw error;
  }
}

async function migrateDown() {
  try {
    console.log('🔄 Revertiendo migración: add-estudiantes-atendidos-sesiones...');

    // 1. Eliminar índice
    await database.query(`
      DROP INDEX IF EXISTS idx_sesiones_usuario_fecha ON sesiones_trabajo
    `);

    // 2. Eliminar columna
    await database.query(`
      ALTER TABLE sesiones_trabajo
      DROP COLUMN IF EXISTS estudiantes_atendidos
    `);

    console.log('✅ Migración revertida exitosamente');
  } catch (error) {
    console.error('❌ Error al revertir migración:', error.message);
    throw error;
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateUp()
    .then(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Proceso fallido:', error);
      process.exit(1);
    });
}

module.exports = { migrateUp, migrateDown };
