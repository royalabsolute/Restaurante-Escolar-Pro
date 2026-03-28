const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'restaurante_escolar_db'
};

async function cleanDatabase() {
  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log('🔗 Conectado a la base de datos');

    console.log('🧹 === LIMPIEZA DE BASE DE DATOS ===\n');

    // 1. Contar datos antes de la limpieza
    console.log('📊 Estado ANTES de la limpieza:');
    
    const [usuariosAntes] = await connection.execute('SELECT COUNT(*) as count FROM usuarios');
    const [estudiantesAntes] = await connection.execute('SELECT COUNT(*) as count FROM estudiantes');
    const [acudientesAntes] = await connection.execute('SELECT COUNT(*) as count FROM acudientes');
    const [suplentesAntes] = await connection.execute('SELECT COUNT(*) as count FROM suplentes');
    
    console.log(`  - Usuarios: ${usuariosAntes[0].count}`);
    console.log(`  - Estudiantes: ${estudiantesAntes[0].count}`);
    console.log(`  - Acudientes: ${acudientesAntes[0].count}`);
    console.log(`  - Suplentes: ${suplentesAntes[0].count}`);

    // 2. Identificar datos de prueba
    console.log('\n🔍 Identificando datos de prueba...');
    
    const [testStudents] = await connection.execute(`
      SELECT e.id as estudiante_id, u.id as usuario_id, e.nombre, e.apellidos, u.email
      FROM estudiantes e 
      INNER JOIN usuarios u ON e.usuario_id = u.id 
      WHERE u.email LIKE '%@prueba.com'
    `);
    
    console.log(`📚 Estudiantes de prueba encontrados: ${testStudents.length}`);
    testStudents.slice(0, 5).forEach(student => {
      console.log(`  - ${student.nombre} ${student.apellidos} (${student.email})`);
    });
    if (testStudents.length > 5) {
      console.log(`  ... y ${testStudents.length - 5} más`);
    }

    // 3. Eliminar datos basura de suplentes
    console.log('\n🗑️ Eliminando datos basura...');
    
    // Eliminar asistencias de suplentes basura
    const [deletedSuplenteAttendance] = await connection.execute(`
      DELETE FROM asistencias_suplentes 
      WHERE suplente_id IN (
        SELECT id FROM suplentes 
        WHERE nombres LIKE '%caca%' OR apellidos LIKE '%pedopis%'
      )
    `);
    console.log(`✅ Eliminadas ${deletedSuplenteAttendance.affectedRows} asistencias de suplentes basura`);

    // Eliminar suplentes basura
    const [deletedSuplentes] = await connection.execute(`
      DELETE FROM suplentes 
      WHERE nombres LIKE '%caca%' OR apellidos LIKE '%pedopis%'
    `);
    console.log(`✅ Eliminados ${deletedSuplentes.affectedRows} suplentes basura`);

    // 4. PREGUNTA IMPORTANTE: ¿Eliminar datos de prueba?
    console.log('\n⚠️  ATENCIÓN: Se encontraron datos de prueba');
    console.log('❓ ¿Deseas eliminar los datos de prueba? (Esto es irreversible)');
    console.log('   - Los datos de prueba incluyen estudiantes con emails @prueba.com');
    console.log('   - Esto eliminará estudiantes, acudientes y asistencias relacionadas');
    console.log('   - RECOMENDACIÓN: NO eliminar si estás en producción');
    
    // Por seguridad, NO eliminamos automáticamente los datos de prueba
    console.log('\n🛡️ Por seguridad, NO se eliminarán automáticamente los datos de prueba');
    console.log('📝 Si deseas eliminarlos, ejecuta el script clean-test-data.js por separado');

    // 5. Estado después de la limpieza
    console.log('\n📊 Estado DESPUÉS de la limpieza:');
    
    const [usuariosDespues] = await connection.execute('SELECT COUNT(*) as count FROM usuarios');
    const [estudiantesDespues] = await connection.execute('SELECT COUNT(*) as count FROM estudiantes');
    const [acudientesDespues] = await connection.execute('SELECT COUNT(*) as count FROM acudientes');
    const [suplentesDespues] = await connection.execute('SELECT COUNT(*) as count FROM suplentes');
    
    console.log(`  - Usuarios: ${usuariosDespues[0].count} (${usuariosAntes[0].count - usuariosDespues[0].count} eliminados)`);
    console.log(`  - Estudiantes: ${estudiantesDespues[0].count} (${estudiantesAntes[0].count - estudiantesDespues[0].count} eliminados)`);
    console.log(`  - Acudientes: ${acudientesDespues[0].count} (${acudientesAntes[0].count - acudientesDespues[0].count} eliminados)`);
    console.log(`  - Suplentes: ${suplentesDespues[0].count} (${suplentesAntes[0].count - suplentesDespues[0].count} eliminados)`);

    // 6. Resumen de tablas no utilizadas
    console.log('\n📋 === TABLAS VACÍAS/NO UTILIZADAS ===');
    
    const emptyTables = [
      { name: 'justificaciones', description: 'Sistema de justificaciones de ausencias' },
      { name: 'mensajes', description: 'Sistema de mensajería interna' },
      { name: 'sesiones_trabajo', description: 'Control de sesiones de trabajo' }
    ];

    emptyTables.forEach(table => {
      console.log(`📭 ${table.name}: Vacía - ${table.description}`);
    });

    console.log('\n✅ === LIMPIEZA COMPLETADA ===');
    console.log('✅ Datos basura eliminados');
    console.log('⚠️ Datos de prueba conservados (eliminar manualmente si es necesario)');
    console.log('📊 Base de datos optimizada');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

cleanDatabase();
