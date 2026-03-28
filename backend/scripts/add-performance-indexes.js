const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurante_escolar_db'
};

async function addPerformanceIndexes() {
  let connection;
  
  try {
    console.log('🔍 Conectando a la base de datos...');
    connection = await mysql.createConnection(config);
    
    console.log('✅ Conexión establecida');
    console.log('📊 Agregando índices de performance...\n');

    const indexes = [
      {
        name: 'idx_asistencias_fecha',
        table: 'asistencias',
        columns: 'fecha',
        description: 'Optimizar consultas por fecha'
      },
      {
        name: 'idx_asistencias_estudiante_fecha',
        table: 'asistencias',
        columns: 'estudiante_id, fecha',
        description: 'Optimizar consultas de asistencia por estudiante y fecha'
      },
      {
        name: 'idx_estudiantes_qr',
        table: 'estudiantes',
        columns: 'codigo_qr',
        description: 'Optimizar búsquedas por código QR'
      },
      {
        name: 'idx_usuarios_email',
        table: 'usuarios',
        columns: 'email',
        description: 'Optimizar login por email'
      },
      {
        name: 'idx_usuarios_matricula',
        table: 'usuarios',
        columns: 'matricula',
        description: 'Optimizar login por matrícula'
      },
      {
        name: 'idx_usuarios_estado',
        table: 'usuarios',
        columns: 'estado',
        description: 'Optimizar filtros por estado de usuario'
      },
      {
        name: 'idx_justificaciones_estudiante',
        table: 'justificaciones',
        columns: 'estudiante_id',
        description: 'Optimizar consultas de justificaciones por estudiante'
      },
      {
        name: 'idx_justificaciones_estado',
        table: 'justificaciones',
        columns: 'estado',
        description: 'Optimizar filtros por estado de justificación'
      },
      {
        name: 'idx_justificaciones_fecha',
        table: 'justificaciones',
        columns: 'fecha_creacion',
        description: 'Optimizar consultas por fecha de creación'
      }
    ];

    let indexesCreated = 0;
    let indexesSkipped = 0;

    for (const index of indexes) {
      try {
        // Verificar si el índice ya existe
        const [existing] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM information_schema.statistics 
          WHERE table_schema = ? AND table_name = ? AND index_name = ?
        `, [config.database, index.table, index.name]);

        if (existing[0].count > 0) {
          console.log(`⏭️  Índice ${index.name} ya existe - omitiendo`);
          indexesSkipped++;
          continue;
        }

        // Crear el índice
        const sql = `CREATE INDEX ${index.name} ON ${index.table} (${index.columns})`;
        await connection.execute(sql);
        
        console.log(`✅ Creado: ${index.name} en ${index.table} (${index.columns})`);
        console.log(`   📝 ${index.description}`);
        indexesCreated++;
        
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⏭️  Índice ${index.name} ya existe - omitiendo`);
          indexesSkipped++;
        } else {
          console.error(`❌ Error creando ${index.name}:`, error.message);
        }
      }
    }

    // Verificar estadísticas de la base de datos
    console.log('\n📊 Estadísticas de la base de datos:');
    
    const tables = ['usuarios', 'estudiantes', 'asistencias', 'justificaciones'];
    for (const table of tables) {
      try {
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   📋 ${table}: ${count[0].count} registros`);
      } catch (error) {
        console.log(`   ❌ Error obteniendo estadísticas de ${table}`);
      }
    }

    console.log(`\n🎉 Optimización completada!`);
    console.log(`✅ Índices creados: ${indexesCreated}`);
    console.log(`⏭️  Índices omitidos (ya existían): ${indexesSkipped}`);
    console.log(`📈 Performance mejorada para consultas frecuentes`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('💡 Verifique que MySQL esté ejecutándose y las credenciales sean correctas');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  addPerformanceIndexes();
}

module.exports = addPerformanceIndexes;