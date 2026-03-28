const mysql = require('mysql2/promise');

// Ajusta estos parámetros según tu entorno local
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'restaurante_escolar_db'
};

async function ensureNullableColumn(connection) {
  const [columns] = await connection.query("SHOW COLUMNS FROM asistencias_suplentes LIKE 'registrado_por'");
  const column = columns?.[0];

  if (!column) {
    throw new Error('Columna registrado_por no encontrada en asistencias_suplentes');
  }

  if (column.Null !== 'YES') {
    console.log('↺ Haciendo nullable la columna asistencias_suplentes.registrado_por');
    await connection.query(
      'ALTER TABLE asistencias_suplentes MODIFY COLUMN registrado_por INT NULL'
    );
  } else {
    console.log('✅ La columna registrado_por ya permite valores NULL');
  }
}

async function dropExistingConstraint(connection) {
  const [constraints] = await connection.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'asistencias_suplentes'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'asistencias_suplentes_ibfk_2'`,
    [config.database]
  );

  if (constraints.length > 0) {
    console.log('↺ Eliminando constraint existente asistencias_suplentes_ibfk_2');
    await connection.query(
      'ALTER TABLE asistencias_suplentes DROP FOREIGN KEY asistencias_suplentes_ibfk_2'
    );
  } else {
    console.log('ℹ️ No se encontró constraint previo asistencias_suplentes_ibfk_2');
  }
}

async function cleanOrphanRows(connection) {
  console.log('🧹 Buscando registros huérfanos en asistencias_suplentes…');
  const [orphans] = await connection.query(
    `SELECT id, registrado_por FROM asistencias_suplentes
     WHERE registrado_por IS NOT NULL
       AND registrado_por NOT IN (SELECT id FROM usuarios)`
  );

  if (orphans.length === 0) {
    console.log('✅ No se encontraron registros huérfanos');
    return;
  }

  const orphanIds = orphans.map(row => row.id);
  console.log(`↺ Limpiando ${orphans.length} registros huérfanos (ids: ${orphanIds.join(', ')})`);

  await connection.query(
    `UPDATE asistencias_suplentes
     SET registrado_por = NULL
     WHERE id IN (${orphanIds.map(() => '?').join(', ')})`,
    orphanIds
  );
}

async function addConstraint(connection) {
  console.log('🔒 Agregando constraint asistencias_suplentes_ibfk_2 (ON DELETE SET NULL)…');
  await connection.query(
    `ALTER TABLE asistencias_suplentes
       ADD CONSTRAINT asistencias_suplentes_ibfk_2
       FOREIGN KEY (registrado_por)
       REFERENCES usuarios(id)
       ON DELETE SET NULL
       ON UPDATE CASCADE`
  );
  console.log('✅ Constraint creada correctamente');
}

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('🔗 Conectado a la base de datos');

    await ensureNullableColumn(connection);
    await dropExistingConstraint(connection);
    await cleanOrphanRows(connection);
    await addConstraint(connection);

    console.log('\n🎉 Esquema de asistencias_suplentes actualizado con éxito');
  } catch (error) {
    console.error('❌ Error actualizando asistencias_suplentes:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

main();
