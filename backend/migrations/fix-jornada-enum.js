/**
 * Migración para corregir el ENUM de la columna jornada en la tabla estudiantes
 * Cambiar de valores corruptos a 'Mañana' y 'Tarde' solamente
 */

const database = require('../src/config/database');

async function fixJornadaEnum() {
  const connection = await database.getConnection();
  
  try {
    console.log('🔧 Iniciando corrección de columna jornada...');

    // Paso 1: Cambiar la columna a VARCHAR temporalmente
    console.log('📝 Paso 1: Convirtiendo jornada a VARCHAR...');
    await connection.query(`
      ALTER TABLE estudiantes 
      MODIFY COLUMN jornada VARCHAR(50)
    `);

    // Paso 2: Normalizar datos existentes
    console.log('📝 Paso 2: Normalizando datos existentes...');
    
    // Convertir valores vacíos o NULL a 'Mañana' por defecto
    await connection.query(`
      UPDATE estudiantes 
      SET jornada = 'Mañana' 
      WHERE jornada IS NULL OR jornada = '' OR jornada = 'ma├▒ana' OR jornada = 'mañana'
    `);
    
    // Normalizar 'tarde' a 'Tarde'
    await connection.query(`
      UPDATE estudiantes 
      SET jornada = 'Tarde' 
      WHERE jornada = 'tarde'
    `);

    // Convertir otros valores a Mañana por defecto
    await connection.query(`
      UPDATE estudiantes 
      SET jornada = 'Mañana' 
      WHERE jornada NOT IN ('Mañana', 'Tarde')
    `);

    // Paso 3: Cambiar a ENUM con valores correctos
    console.log('📝 Paso 3: Convirtiendo a ENUM con valores correctos...');
    await connection.query(`
      ALTER TABLE estudiantes 
      MODIFY COLUMN jornada ENUM('Mañana', 'Tarde') NOT NULL DEFAULT 'Mañana'
    `);

    // Verificar resultados
    const [results] = await connection.query(`
      SELECT jornada, COUNT(*) as count 
      FROM estudiantes 
      GROUP BY jornada
    `);

    console.log('✅ Migración completada exitosamente!');
    console.log('📊 Distribución de jornadas:');
    results.forEach(row => {
      console.log(`   - ${row.jornada}: ${row.count} estudiantes`);
    });

    await connection.release();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    await connection.release();
    process.exit(1);
  }
}

// Ejecutar migración
fixJornadaEnum();
