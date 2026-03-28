const database = require('../src/config/database');

async function runMigration() {
  console.log('🔄 Ejecutando migración: Agregar campos de asistencias rechazadas...');
  
  try {
    // Agregar campo rechazado
    await database.query(`
      ALTER TABLE asistencias 
      ADD COLUMN IF NOT EXISTS rechazado TINYINT(1) DEFAULT 0 COMMENT '1 si la entrada fue rechazada, 0 si fue aceptada'
    `);
    console.log('✅ Campo "rechazado" agregado');

    // Agregar campo motivo_rechazo
    await database.query(`
      ALTER TABLE asistencias 
      ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT NULL COMMENT 'Motivo por el cual se rechazó la entrada'
    `);
    console.log('✅ Campo "motivo_rechazo" agregado');

    // Agregar índice
    try {
      await database.query(`
        ALTER TABLE asistencias 
        ADD INDEX idx_rechazado (rechazado, estudiante_id, fecha)
      `);
      console.log('✅ Índice idx_rechazado creado');
    } catch (indexError) {
      if (indexError.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Índice idx_rechazado ya existe');
      } else {
        throw indexError;
      }
    }

    // Registrar en auditoría
    await database.query(`
      INSERT INTO auditoria (usuario_id, tabla_afectada, accion, descripcion, fecha_accion)
      VALUES (1, 'asistencias', 'ALTER_TABLE', 'Agregados campos rechazado y motivo_rechazo para gestión de entradas rechazadas', NOW())
    `);
    console.log('✅ Migración registrada en auditoría');

    console.log('🎉 Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  }
}

runMigration();
