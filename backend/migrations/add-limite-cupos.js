// Migración para agregar el campo limite_cupos_restaurante a configuracion_institucional
const database = require('../src/config/database');

async function runMigration() {
  try {
    console.log('🔄 Iniciando migración: Agregar límite de cupos al restaurante...');

    // Verificar si la columna ya existe
    const columns = await database.query(`
      SHOW COLUMNS FROM configuracion_institucional LIKE 'limite_cupos_restaurante'
    `);

    if (columns && columns.length > 0) {
      console.log('ℹ️ La columna limite_cupos_restaurante ya existe. Saltando migración.');
      return;
    }

    // Agregar la columna
    await database.query(`
      ALTER TABLE configuracion_institucional 
      ADD COLUMN limite_cupos_restaurante INT DEFAULT 270 NOT NULL
      AFTER email
    `);

    console.log('✅ Columna limite_cupos_restaurante agregada exitosamente');

    // Actualizar el registro existente si lo hay
    await database.query(`
      UPDATE configuracion_institucional 
      SET limite_cupos_restaurante = 270 
      WHERE limite_cupos_restaurante IS NULL OR limite_cupos_restaurante = 0
    `);

    console.log('✅ Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✅ Migración ejecutada');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error ejecutando migración:', error);
      process.exit(1);
    });
}

module.exports = runMigration;
