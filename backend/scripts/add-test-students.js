const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurante_escolar_db',
  charset: 'utf8mb4',
  timezone: 'local'
};

// Listas de datos aleatorios para generar estudiantes
const apellidosLista = [
  'García López', 'Martínez Sánchez', 'Rodríguez Pérez', 'Fernández González',
  'López Martínez', 'González Rodríguez', 'Sánchez Fernández', 'Pérez García',
  'Ramírez Torres', 'Torres Ramírez', 'Flores Castro', 'Castro Flores',
  'Rivera Morales', 'Morales Rivera', 'Gómez Hernández', 'Hernández Gómez',
  'Díaz Jiménez', 'Jiménez Díaz', 'Álvarez Ruiz', 'Ruiz Álvarez',
  'Navarro Vázquez', 'Vázquez Navarro', 'Romero Núñez', 'Núñez Romero',
  'Ortiz Medina', 'Medina Ortiz', 'Silva Ramos', 'Ramos Silva',
  'Mendoza Vargas', 'Vargas Mendoza', 'Cruz Reyes', 'Reyes Cruz'
];

const gradosLista = [
  'Preescolar-1', 'Preescolar-2', 'Preescolar-3', 'Preescolar-4', 
  'Preescolar-5', 'Preescolar-6',
  'Transición-1', 'Transición-2', 'Transición-3', 'Transición-4',
  '1ro-1', '1ro-2', '1ro-3',
  '2do-1', '2do-2', '2do-3',
  '3ro-1', '3ro-2', '3ro-3',
  '4to-1', '4to-2', '4to-3',
  '5to-1', '5to-2', '5to-3'
];

// Función para generar código QR único
function generarCodigoQR(estudianteId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7);
  return `QR_EST_${estudianteId}_${timestamp}_${random}`;
}

// Función para obtener apellidos aleatorios
function obtenerApellidosAleatorios() {
  return apellidosLista[Math.floor(Math.random() * apellidosLista.length)];
}

// Función para obtener grado aleatorio
function obtenerGradoAleatorio() {
  return gradosLista[Math.floor(Math.random() * gradosLista.length)];
}

// Función para obtener prioridad aleatoria (1-3)
function obtenerPrioridadAleatoria() {
  return Math.floor(Math.random() * 3) + 1;
}

async function addTestStudents() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // Obtener el número actual de estudiantes de prueba
    const [existingTests] = await connection.execute(
      "SELECT COUNT(*) as count FROM estudiantes WHERE nombre LIKE 'Prueba %'"
    );
    const currentCount = existingTests[0].count;
    console.log(`📊 Estudiantes de prueba actuales: ${currentCount}`);
    
    if (currentCount >= 270) {
      console.log('✅ Ya existen 270 o más estudiantes de prueba. No se agregaron más.');
      return;
    }
    
    const studentsToAdd = 270 - currentCount;
    console.log(`➕ Se agregarán ${studentsToAdd} estudiantes de prueba...`);
    
    // Obtener el último ID de usuario
    const [lastUserId] = await connection.execute(
      'SELECT MAX(id) as lastId FROM usuarios'
    );
    let nextUserId = (lastUserId[0].lastId || 0) + 1;
    
    // Preparar statements de inserción
    const insertUserQuery = `
      INSERT INTO usuarios (email, password, rol)
      VALUES (?, ?, ?)
    `;
    
    const insertStudentQuery = `
      INSERT INTO estudiantes 
      (usuario_id, nombre, apellidos, fecha_nacimiento, grado, jornada, estrato, prioridad, codigo_qr, qr_usado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    
    let insertados = 0;
    const startNumber = currentCount + 1;
    
    console.log('\n🚀 Iniciando inserción de estudiantes...\n');
    
    for (let i = 0; i < studentsToAdd; i++) {
      const numero = startNumber + i;
      const nombre = `Prueba ${numero}`;
      const apellidos = obtenerApellidosAleatorios();
      const grado = obtenerGradoAleatorio();
      const prioridad = obtenerPrioridadAleatoria();
      const fechaNacimiento = '2010-01-01'; // Fecha genérica
      const jornada = 'jornada_unica';
      const estrato = Math.floor(Math.random() * 3) + 1; // Estrato 1-3
      
      // Generar código QR único
      const codigoQR = generarCodigoQR(nextUserId + i);
      
      try {
        // Primero insertar el usuario
        const email = `prueba${numero}@test.com`;
        const password = '$2a$10$dummyHashForTestStudent'; // Hash dummy
        const rol = 'estudiante';
        
        const [userResult] = await connection.execute(insertUserQuery, [
          email,
          password,
          rol
        ]);
        
        const usuarioId = userResult.insertId;
        
        // Luego insertar el estudiante
        await connection.execute(insertStudentQuery, [
          usuarioId,
          nombre,
          apellidos,
          fechaNacimiento,
          grado,
          jornada,
          estrato,
          prioridad,
          codigoQR
        ]);
        
        insertados++;
        
        // Mostrar progreso cada 20 estudiantes
        if (insertados % 20 === 0) {
          console.log(`✓ Insertados ${insertados}/${studentsToAdd} estudiantes...`);
        }
      } catch (error) {
        console.error(`❌ Error insertando ${nombre}:`, error.message);
      }
    }
    
    console.log(`\n✅ Proceso completado!`);
    console.log(`📈 Total insertados: ${insertados} estudiantes`);
    
    // Verificar el total final
    const [finalCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM estudiantes WHERE nombre LIKE 'Prueba %'"
    );
    console.log(`📊 Total de estudiantes de prueba en la base de datos: ${finalCount[0].count}`);
    
    // Mostrar distribución por prioridad
    const [priorityDist] = await connection.execute(
      "SELECT prioridad, COUNT(*) as cantidad FROM estudiantes WHERE nombre LIKE 'Prueba %' GROUP BY prioridad ORDER BY prioridad"
    );
    
    console.log('\n📊 Distribución por prioridad:');
    priorityDist.forEach(row => {
      console.log(`   Prioridad ${row.prioridad}: ${row.cantidad} estudiantes`);
    });
    
    // Mostrar algunos ejemplos
    const [samples] = await connection.execute(
      "SELECT nombre, apellidos, grado, prioridad, codigo_qr FROM estudiantes WHERE nombre LIKE 'Prueba %' ORDER BY id DESC LIMIT 5"
    );
    
    console.log('\n📝 Últimos 5 estudiantes agregados:');
    samples.forEach(student => {
      console.log(`   ${student.nombre} - ${student.apellidos} - ${student.grado} - Prioridad ${student.prioridad}`);
    });
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada.');
    }
  }
}

// Ejecutar el script
if (require.main === module) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  📚 AGREGAR ESTUDIANTES DE PRUEBA (90 → 270)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  addTestStudents()
    .then(() => {
      console.log('\n✨ Script finalizado exitosamente!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 El script falló:', error);
      process.exit(1);
    });
}

module.exports = { addTestStudents };
