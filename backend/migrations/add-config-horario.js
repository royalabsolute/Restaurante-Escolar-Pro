// Migración para agregar las columnas de horario válido a configuracion_institucional
const database = require('../src/config/database');

async function runMigration() {
  try {
    console.log('🔄 Iniciando migración: agregar columnas de horario válido...');

    const [inicioColumn] = await database.query(`
      SHOW COLUMNS FROM configuracion_institucional LIKE 'horario_valido_inicio'
    `);
    const [finColumn] = await database.query(`
      SHOW COLUMNS FROM configuracion_institucional LIKE 'horario_valido_fin'
    `);

    const needsInicio = !inicioColumn;
    const needsFin = !finColumn;

    if (!needsInicio && !needsFin) {
      console.log('ℹ️ Las columnas de horario válido ya existen. No se realizan cambios.');
      return;
    }

    if (needsInicio) {
      await database.query(`
        ALTER TABLE configuracion_institucional
        ADD COLUMN horario_valido_inicio TIME DEFAULT '11:00:00' NOT NULL
        AFTER limite_cupos_restaurante
      `);
      console.log('✅ Columna horario_valido_inicio agregada.');
    }

    if (needsFin) {
      await database.query(`
        ALTER TABLE configuracion_institucional
        ADD COLUMN horario_valido_fin TIME DEFAULT '15:00:00' NOT NULL
        AFTER horario_valido_inicio
      `);
      console.log('✅ Columna horario_valido_fin agregada.');
    }

    await database.query(`
      UPDATE configuracion_institucional
      SET 
        horario_valido_inicio = COALESCE(horario_valido_inicio, '11:00:00'),
        horario_valido_fin = COALESCE(horario_valido_fin, '15:00:00')
    `);

    console.log('✅ Migración completada exitosamente.');
  } catch (error) {
    console.error('❌ Error en la migración de horario válido:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✅ Migración ejecutada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando la migración:', error);
      process.exit(1);
    });
}

module.exports = runMigration;
