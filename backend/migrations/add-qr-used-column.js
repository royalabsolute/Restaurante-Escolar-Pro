const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'restaurante_escolar_db'
};

async function addQrUsedColumn() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');

    // Verificar si la columna ya existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'restaurante_escolar_db' 
        AND TABLE_NAME = 'estudiantes' 
        AND COLUMN_NAME = 'qr_usado'
    `);

    if (columns.length === 0) {
      // La columna no existe, agregarla
      await connection.execute(`
        ALTER TABLE estudiantes 
        ADD COLUMN qr_usado BOOLEAN DEFAULT FALSE 
        COMMENT 'Indica si el QR del estudiante ya fue usado en pruebas'
      `);
      console.log('✅ Columna qr_usado agregada exitosamente');
    } else {
      console.log('ℹ️ La columna qr_usado ya existe');
    }

    // Verificar la estructura de la tabla
    const [tableInfo] = await connection.execute(`
      DESCRIBE estudiantes
    `);

    console.log('\n📋 Estructura actual de la tabla estudiantes:');
    tableInfo.forEach(column => {
      if (column.Field === 'qr_usado') {
        console.log(`✅ ${column.Field}: ${column.Type} (${column.Null === 'YES' ? 'NULL' : 'NOT NULL'}) - ${column.Default || 'Sin default'}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
addQrUsedColumn();
