/**
 * Migración para corregir y verificar la tabla sesiones_trabajo
 * Fecha: 2025-10-12
 */

const database = require('../src/config/database');

async function migrate() {
  try {
    console.log('🔧 Iniciando migración de sesiones_trabajo...');

    // 1. Verificar que la tabla existe
    const tables = await database.query(`
      SHOW TABLES LIKE 'sesiones_trabajo'
    `);

    if (!tables || tables.length === 0) {
      console.log('❌ La tabla sesiones_trabajo no existe. Creándola...');
      await database.query(`
        CREATE TABLE sesiones_trabajo (
          id INT(11) NOT NULL AUTO_INCREMENT,
          usuario_id INT(11) NOT NULL,
          fecha DATE NOT NULL,
          hora_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          hora_fin TIMESTAMP NULL DEFAULT NULL,
          total_horas DECIMAL(4,2) DEFAULT NULL,
          tipo_sesion ENUM('alfabetizacion','docencia','administrativa') DEFAULT 'alfabetizacion',
          PRIMARY KEY (id),
          KEY usuario_id (usuario_id),
          CONSTRAINT sesiones_trabajo_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log('✅ Tabla sesiones_trabajo creada');
    } else {
      console.log('✅ Tabla sesiones_trabajo ya existe');
    }

    // 2. Verificar estructura de columnas
    const columns = await database.query(`
      SHOW COLUMNS FROM sesiones_trabajo
    `);

    const columnNames = columns.map(col => col.Field);
    console.log('📋 Columnas actuales:', columnNames);

    // 3. Asegurar que total_horas existe
    if (!columnNames.includes('total_horas')) {
      console.log('➕ Agregando columna total_horas...');
      await database.query(`
        ALTER TABLE sesiones_trabajo 
        ADD COLUMN total_horas DECIMAL(4,2) DEFAULT NULL AFTER hora_fin
      `);
      console.log('✅ Columna total_horas agregada');
    }

    // 4. Asegurar que tipo_sesion existe
    if (!columnNames.includes('tipo_sesion')) {
      console.log('➕ Agregando columna tipo_sesion...');
      await database.query(`
        ALTER TABLE sesiones_trabajo 
        ADD COLUMN tipo_sesion ENUM('alfabetizacion','docencia','administrativa') 
        DEFAULT 'alfabetizacion' AFTER total_horas
      `);
      console.log('✅ Columna tipo_sesion agregada');
    }

    // 5. Calcular total_horas para sesiones finalizadas sin este dato
    console.log('🔄 Actualizando total_horas para sesiones finalizadas...');
    const result = await database.query(`
      UPDATE sesiones_trabajo 
      SET total_horas = TIMESTAMPDIFF(MINUTE, hora_inicio, hora_fin) / 60
      WHERE hora_fin IS NOT NULL AND total_horas IS NULL
    `);
    console.log(`✅ ${result.affectedRows || 0} sesiones actualizadas`);

    // 6. Mostrar estadísticas
    const stats = await database.query(`
      SELECT 
        COUNT(*) as total_sesiones,
        SUM(CASE WHEN hora_fin IS NULL THEN 1 ELSE 0 END) as sesiones_activas,
        SUM(CASE WHEN hora_fin IS NOT NULL THEN 1 ELSE 0 END) as sesiones_finalizadas,
        ROUND(SUM(total_horas), 2) as total_horas_trabajadas
      FROM sesiones_trabajo
    `);

    console.log('\n📊 ESTADÍSTICAS DE SESIONES:');
    console.log('Total sesiones:', stats[0].total_sesiones);
    console.log('Sesiones activas:', stats[0].sesiones_activas);
    console.log('Sesiones finalizadas:', stats[0].sesiones_finalizadas);
    console.log('Total horas trabajadas:', stats[0].total_horas_trabajadas || 0);

    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrate();
