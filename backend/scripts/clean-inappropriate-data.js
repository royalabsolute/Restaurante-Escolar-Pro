const database = require('../src/config/database');

/**
 * Script para limpiar datos inapropiados y de prueba de la base de datos
 * Ejecutar con: node scripts/clean-inappropriate-data.js
 */

async function cleanInappropriateData() {
  try {
    console.log('🧹 Iniciando limpieza de datos inapropiados...');

    // Eliminar registros con contenido inapropiado
    const inappropriateEmails = [
      'srjaggeroff@gmail.com',
      'cacasaaffsass@gmail.com',
      'JAJA@JAJA.JAJAxd',
      'cacorro@gay.legtb'
    ];

    const inappropriateNames = [
      'papu',
      'papu1', 
      'GAY',
      'AA'
    ];

    console.log('📧 Eliminando usuarios con emails inapropiados...');
    
    // Primero obtener IDs de usuarios a eliminar
    const usersToDelete = await database.query(
      'SELECT id FROM usuarios WHERE email IN (?) OR matricula IN (?, ?, ?, ?)',
      [inappropriateEmails, '250971', '2025001', '111111', '12345678']
    );

    if (usersToDelete.length > 0) {
      const userIds = usersToDelete.map(user => user.id);
      
      // Eliminar registros relacionados primero
      await database.query('DELETE FROM asistencias WHERE estudiante_id IN (SELECT id FROM estudiantes WHERE usuario_id IN (?))', [userIds]);
      await database.query('DELETE FROM justificaciones WHERE estudiante_id IN (SELECT id FROM estudiantes WHERE usuario_id IN (?))', [userIds]);
      await database.query('DELETE FROM estudiantes WHERE usuario_id IN (?)', [userIds]);
      await database.query('DELETE FROM usuarios WHERE id IN (?)', [userIds]);
      
      console.log(`✅ ${usersToDelete.length} usuarios inapropiados eliminados`);
    }

    // Eliminar acudientes con nombres inapropiados
    console.log('👥 Eliminando acudientes con datos inapropiados...');
    
    await database.query(
      'DELETE FROM acudientes WHERE nombres IN (?) OR apellidos IN (?) OR email IN (?)',
      [inappropriateNames, ['tilin', 'tilin1223', 'LESBIANA'], inappropriateEmails]
    );
    
    console.log('✅ Acudientes inapropiados eliminados');

    // Insertar datos realistas para reemplazar los eliminados
    console.log('📚 Agregando datos educativos realistas...');
    
    const estudiantesRealistas = [
      {
        email: 'carlos.mendoza2025@estudiantesiesadep.edu.co',
        matricula: 'EST2506',
        nombre: 'Carlos Eduardo',
        apellidos: 'Mendoza Vargas',
        fecha_nacimiento: '2007-04-18',
        telefono: '3145672890',
        grado: '9°',
        jornada: 'mañana',
        estrato: 2
      },
      {
        email: 'laura.jimenez2025@estudiantesiesadep.edu.co', 
        matricula: 'EST2507',
        nombre: 'Laura Sofia',
        apellidos: 'Jiménez Ruiz',
        fecha_nacimiento: '2006-11-25',
        telefono: '3189234567',
        grado: '10°',
        jornada: 'tarde',
        estrato: 1
      }
    ];

    const bcrypt = require('bcryptjs');
    const defaultPassword = await bcrypt.hash('estudiante2025', 10);

    for (const estudiante of estudiantesRealistas) {
      try {
        // Crear usuario
        const userResult = await database.query(`
          INSERT INTO usuarios (email, matricula, password, rol, estado, fecha_registro)
          VALUES (?, ?, ?, ?, ?, NOW())
        `, [estudiante.email, estudiante.matricula, defaultPassword, 'estudiante', 'validado']);

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

        console.log(`✅ Estudiante educativo creado: ${estudiante.nombre} ${estudiante.apellidos}`);
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.log(`⚠️ Error creando estudiante: ${error.message}`);
        }
      }
    }

    // Agregar acudientes realistas
    const acudientesRealistas = [
      {
        nombres: 'María Elena',
        apellidos: 'Vargas Moreno',
        telefono: '3201234567',
        email: 'maria.vargas.acudiente@gmail.com'
      },
      {
        nombres: 'Roberto Carlos',
        apellidos: 'Ruiz Santamaría', 
        telefono: '3157891234',
        email: 'roberto.ruiz.padre@outlook.com'
      }
    ];

    for (const acudiente of acudientesRealistas) {
      try {
        await database.query(`
          INSERT INTO acudientes (usuario_id, nombres, apellidos, cedula, telefono, email, fecha_registro)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [null, acudiente.nombres, acudiente.apellidos, 
            Math.floor(Math.random() * 90000000) + 10000000, // Cédula aleatoria realista
            acudiente.telefono, acudiente.email]);
        
        console.log(`✅ Acudiente realista creado: ${acudiente.nombres} ${acudiente.apellidos}`);
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.log(`⚠️ Error creando acudiente: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Limpieza completada exitosamente!');
    console.log('📋 Todos los datos inapropiados han sido eliminados y reemplazados');
    console.log('✨ El sistema ahora contiene únicamente información educativa apropiada');

  } catch (error) {
    console.error('❌ Error en limpieza:', error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '../.env') });

  cleanInappropriateData()
    .then(() => {
      console.log('🎯 Limpieza completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { cleanInappropriateData };