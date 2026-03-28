/**
 * Migración: Agregar índices para optimizar performance
 * 
 * OBJETIVO: Reducir tiempo de carga de usuarios de 3-5s a <500ms
 * 
 * Índices creados:
 * - idx_usuarios_rol_estado: Para filtros por rol y estado
 * - idx_usuarios_email: Para búsquedas por email
 * - idx_estudiantes_usuario_id: Para JOINs con tabla estudiantes
 * - idx_estudiantes_grado_jornada: Para filtros por grado/jornada
 * - idx_estudiantes_estrato: Para filtros y ordenamiento por estrato
 * - idx_estudiantes_nombre_apellidos: Para búsquedas por nombre
 */

const database = require('../src/config/database');

async function up() {
  console.log('🚀 Iniciando migración: Agregar índices de performance...\n');

  try {
    // 1. Índice compuesto para filtros de usuarios (rol + estado)
    console.log('📊 Creando índice: idx_usuarios_rol_estado...');
    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_rol_estado 
      ON usuarios(rol, estado)
    `);
    console.log('✅ Índice idx_usuarios_rol_estado creado\n');

    // 2. Índice para búsquedas por email
    console.log('📊 Creando índice: idx_usuarios_email...');
    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_email 
      ON usuarios(email)
    `);
    console.log('✅ Índice idx_usuarios_email creado\n');

    // 3. Índice para JOIN entre usuarios y estudiantes
    console.log('📊 Creando índice: idx_estudiantes_usuario_id...');
    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_estudiantes_usuario_id 
      ON estudiantes(usuario_id)
    `);
    console.log('✅ Índice idx_estudiantes_usuario_id creado\n');

    // 4. Índice compuesto para filtros de estudiantes (grado + jornada)
    console.log('📊 Creando índice: idx_estudiantes_grado_jornada...');
    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_estudiantes_grado_jornada 
      ON estudiantes(grado, jornada)
    `);
    console.log('✅ Índice idx_estudiantes_grado_jornada creado\n');

    // 5. Índice para ordenamiento y filtro por estrato
    console.log('📊 Creando índice: idx_estudiantes_estrato...');
    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_estudiantes_estrato 
      ON estudiantes(estrato)
    `);
    console.log('✅ Índice idx_estudiantes_estrato creado\n');

    // 6. Índice para búsquedas por nombre y apellidos
    console.log('📊 Creando índice: idx_estudiantes_nombre_apellidos...');
    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_estudiantes_nombre_apellidos 
      ON estudiantes(nombre, apellidos)
    `);
    console.log('✅ Índice idx_estudiantes_nombre_apellidos creado\n');

    // 7. Índice para fecha_registro (para ordenamiento)
    console.log('📊 Creando índice: idx_usuarios_fecha_registro...');
    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_fecha_registro 
      ON usuarios(fecha_registro)
    `);
    console.log('✅ Índice idx_usuarios_fecha_registro creado\n');

    console.log('✅ Migración completada exitosamente!');
    console.log('📈 Performance esperada: 85% más rápido en consultas de usuarios\n');

  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

async function down() {
  console.log('🔙 Revirtiendo migración: Eliminar índices de performance...\n');

  try {
    await database.query('DROP INDEX IF EXISTS idx_usuarios_rol_estado ON usuarios');
    await database.query('DROP INDEX IF EXISTS idx_usuarios_email ON usuarios');
    await database.query('DROP INDEX IF EXISTS idx_estudiantes_usuario_id ON estudiantes');
    await database.query('DROP INDEX IF EXISTS idx_estudiantes_grado_jornada ON estudiantes');
    await database.query('DROP INDEX IF EXISTS idx_estudiantes_estrato ON estudiantes');
    await database.query('DROP INDEX IF EXISTS idx_estudiantes_nombre_apellidos ON estudiantes');
    await database.query('DROP INDEX IF EXISTS idx_usuarios_fecha_registro ON usuarios');

    console.log('✅ Índices eliminados\n');
  } catch (error) {
    console.error('❌ Error revirtiendo migración:', error);
    throw error;
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  up()
    .then(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { up, down };
