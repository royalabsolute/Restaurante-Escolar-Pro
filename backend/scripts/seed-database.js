const database = require('../src/config/database');
const bcrypt = require('bcryptjs');

/**
 * Script para popular la base de datos con datos de prueba
 * Ejecutar con: node scripts/seed-database.js
 */

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seeding de la base de datos...');

    // Verificar si ya existen datos
    const existingUsers = await database.query('SELECT COUNT(*) as count FROM usuarios');
    if (existingUsers[0].count > 0) {
      console.log('⚠️  La base de datos ya contiene datos.');
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('¿Deseas continuar y agregar más datos? (y/N): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ Seeding cancelado.');
        return;
      }
    }

    // 1. Crear usuarios administrativos
    console.log('👥 Creando usuarios administrativos...');
    
    const adminPassword = await bcrypt.hash('admin123', 10);
    const secretaryPassword = await bcrypt.hash('secretaria123', 10);
    const teacherPassword = await bcrypt.hash('docente123', 10);

    // Admin principal
    try {
      await database.query(`
        INSERT INTO usuarios (email, matricula, password, rol, estado, fecha_registro)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, ['admin@restaurante.com', 'ADM001', adminPassword, 'admin', 'validado']);
      console.log('✅ Usuario admin creado');
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') throw error;
      console.log('⚠️  Usuario admin ya existe');
    }

    // Secretaria
    try {
      await database.query(`
        INSERT INTO usuarios (email, matricula, password, rol, estado, fecha_registro)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, ['secretaria@restaurante.com', 'SEC001', secretaryPassword, 'secretaria', 'validado']);
      console.log('✅ Usuario secretaria creado');
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') throw error;
      console.log('⚠️  Usuario secretaria ya existe');
    }

    // Docente/Alfabetizador
    try {
      await database.query(`
        INSERT INTO usuarios (email, matricula, password, rol, estado, fecha_registro)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, ['docente@restaurante.com', 'DOC001', teacherPassword, 'docente', 'validado']);
      console.log('✅ Usuario docente creado');
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') throw error;
      console.log('⚠️  Usuario docente ya existe');
    }

    // 2. Crear estudiantes de prueba
    console.log('🎓 Creando estudiantes de prueba...');
    
    const estudiantesPrueba = [
      {
        email: 'maria.rodriguez2025@estudiantesiesadep.edu.co',
        matricula: 'EST2501',
        nombre: 'María Alejandra',
        apellidos: 'Rodríguez Gómez',
        fecha_nacimiento: '2007-05-12',
        telefono: '3157894561',
        grado: '9°',
        jornada: 'mañana',
        estrato: 2
      },
      {
        email: 'juan.lopez2025@estudiantesiesadep.edu.co',
        matricula: 'EST2502',
        nombre: 'Juan Carlos',
        apellidos: 'López Martínez',
        fecha_nacimiento: '2006-08-20',
        telefono: '3142583697',
        grado: '10°',
        jornada: 'mañana',
        estrato: 2
      },
      {
        email: 'valentina.hernandez2025@estudiantesiesadep.edu.co',
        matricula: 'EST2503',
        nombre: 'Valentina',
        apellidos: 'Hernández Castro',
        fecha_nacimiento: '2005-12-03',
        telefono: '3198765432',
        grado: '11°',
        jornada: 'mañana',
        estrato: 3
      },
      {
        email: 'santiago.vargas2025@estudiantesiesadep.edu.co',
        matricula: 'EST2504',
        nombre: 'Santiago',
        apellidos: 'Vargas Torres',
        fecha_nacimiento: '2008-01-15',
        telefono: '3176549832',
        grado: '8°',
        jornada: 'tarde',
        estrato: 2
      },
      {
        email: 'isabella.morales2025@estudiantesiesadep.edu.co',
        matricula: 'EST2505',
        nombre: 'Isabella',
        apellidos: 'Morales Jiménez',
        fecha_nacimiento: '2007-09-28',
        telefono: '3164821937',
        grado: '9°',
        jornada: 'tarde',
        estrato: 1
      }
    ];

    const estudiantePassword = await bcrypt.hash('estudiante123', 10);

    for (const estudiante of estudiantesPrueba) {
      try {
        // Crear usuario
        const userResult = await database.query(`
          INSERT INTO usuarios (email, matricula, password, rol, estado, fecha_registro)
          VALUES (?, ?, ?, ?, ?, NOW())
        `, [estudiante.email, estudiante.matricula, estudiantePassword, 'estudiante', 'validado']);

        const userId = userResult.insertId;

        // Crear registro de estudiante
        const codigoQR = `QR_EST_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        await database.query(`
          INSERT INTO estudiantes (usuario_id, matricula, nombre, apellidos, fecha_nacimiento, 
                                 telefono, grado, jornada, estrato, codigo_qr, faltas_consecutivas)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `, [userId, estudiante.matricula, estudiante.nombre, estudiante.apellidos,
            estudiante.fecha_nacimiento, estudiante.telefono, estudiante.grado,
            estudiante.jornada, estudiante.estrato, codigoQR]);

        console.log(`✅ Estudiante creado: ${estudiante.nombre} ${estudiante.apellidos}`);
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') throw error;
        console.log(`⚠️  Estudiante ya existe: ${estudiante.email}`);
      }
    }

    // 3. Crear configuraciones básicas
    console.log('⚙️  Creando configuraciones del sistema...');
    
    const configuraciones = [
      {
        clave: 'password_min_length',
        valor: '8',
        descripcion: 'Longitud mínima de contraseña'
      },
      {
        clave: 'max_faltas_consecutivas',
        valor: '4',
        descripcion: 'Máximo de faltas consecutivas antes de suspensión'
      },
      {
        clave: 'sistema_activo',
        valor: 'true',
        descripcion: 'Estado general del sistema'
      },
      {
        clave: 'backup_automatico',
        valor: 'true',
        descripcion: 'Habilitar respaldo automático diario'
      }
    ];

    for (const config of configuraciones) {
      try {
        await database.query(`
          INSERT INTO configuraciones (clave, valor, descripcion, fecha_modificacion)
          VALUES (?, ?, ?, NOW())
        `, [config.clave, config.valor, config.descripcion]);
        console.log(`✅ Configuración creada: ${config.clave}`);
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') throw error;
        console.log(`⚠️  Configuración ya existe: ${config.clave}`);
      }
    }

    // 4. Crear algunos suplentes de prueba
    console.log('👤 Creando estudiantes suplentes...');
    
    const suplentes = [
      {
        nombres: 'Diego Alejandro',
        apellidos: 'González Ramírez',
        grado: '8°',
        jornada: 'mañana'
      },
      {
        nombres: 'Camila Andrea',
        apellidos: 'Torres Vásquez',
        grado: '7°',
        jornada: 'tarde'
      },
      {
        nombres: 'Andrés Felipe',
        apellidos: 'Mejía Salazar',
        grado: '9°',
        jornada: 'mañana'
      }
    ];

    // Obtener ID del docente para registrar como creador
    const docente = await database.query(
      'SELECT id FROM usuarios WHERE rol = "docente" AND estado = "validado" LIMIT 1'
    );
    const docenteId = docente[0]?.id || 1;

    for (const suplente of suplentes) {
      try {
        await database.query(`
          INSERT INTO suplentes (nombres, apellidos, grado, jornada, fecha_registro, registrado_por, total_asistencias, activo)
          VALUES (?, ?, ?, ?, NOW(), ?, 0, 1)
        `, [suplente.nombres, suplente.apellidos, suplente.grado, suplente.jornada, docenteId]);
        console.log(`✅ Suplente creado: ${suplente.nombres} ${suplente.apellidos}`);
      } catch (error) {
        console.log(`⚠️  Error creando suplente: ${error.message}`);
      }
    }

    // 5. Crear algunas asistencias de prueba
    console.log('📋 Creando registros de asistencia de prueba...');
    
    const estudiantes = await database.query(`
      SELECT e.id, e.nombre, e.apellidos 
      FROM estudiantes e 
      JOIN usuarios u ON e.usuario_id = u.id 
      WHERE u.estado = 'validado' 
      LIMIT 3
    `);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const estudiante of estudiantes) {
      try {
        // Asistencia de hoy
        await database.query(`
          INSERT INTO asistencias (estudiante_id, fecha, hora_entrada, metodo_registro, registrado_por, validado)
          VALUES (?, CURDATE(), TIME(NOW()), 'escaner', ?, 1)
        `, [estudiante.id, docenteId]);

        // Asistencia de ayer
        await database.query(`
          INSERT INTO asistencias (estudiante_id, fecha, hora_entrada, metodo_registro, registrado_por, validado)
          VALUES (?, ?, '12:30:00', 'manual', ?, 1)
        `, [estudiante.id, yesterday.toISOString().split('T')[0], docenteId]);

        console.log(`✅ Asistencias creadas para: ${estudiante.nombre} ${estudiante.apellidos}`);
      } catch (error) {
        console.log(`⚠️  Error creando asistencia: ${error.message}`);
      }
    }

    console.log('\n🎉 Seeding completado exitosamente!');
    console.log('\n📋 Usuarios creados:');
    console.log('   Admin: admin@restaurante.com / admin123');
    console.log('   Secretaria: secretaria@restaurante.com / secretaria123');
    console.log('   Docente: docente@restaurante.com / docente123');
    console.log('   Estudiantes: estudiante1@restaurante.com / estudiante123');
    console.log('   (y más estudiantes con el mismo patrón)');

  } catch (error) {
    console.error('❌ Error en seeding:', error.message);
    throw error;
  }
}

// Función para limpiar datos de prueba
async function cleanTestData() {
  try {
    console.log('🧹 Limpiando datos de prueba...');
    
    // Eliminar en orden para respetar foreign keys
    await database.query('DELETE FROM asistencias WHERE id > 0');
    await database.query('DELETE FROM justificaciones WHERE id > 0');
    await database.query('DELETE FROM acudientes WHERE id > 0');
    await database.query('DELETE FROM estudiantes WHERE id > 0');
    await database.query('DELETE FROM suplentes WHERE id > 0');
    await database.query('DELETE FROM usuarios WHERE email LIKE "%@restaurante.com"');
    await database.query('DELETE FROM configuraciones WHERE clave IN ("sistema_activo", "backup_automatico")');
    await database.query('DELETE FROM auditoria WHERE id > 0');
    
    console.log('✅ Datos de prueba eliminados');
  } catch (error) {
    console.error('❌ Error limpiando datos:', error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '../.env') });

  const args = process.argv.slice(2);
  
  if (args.includes('--clean')) {
    cleanTestData()
      .then(() => {
        console.log('🎯 Limpieza completada');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  } else {
    seedDatabase()
      .then(() => {
        console.log('🎯 Seeding completado');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  }
}

module.exports = { seedDatabase, cleanTestData };
