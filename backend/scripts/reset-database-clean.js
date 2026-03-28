/**
 * Script para limpiar completamente la base de datos
 * Elimina todos los datos y crea solo usuarios básicos del sistema
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function resetDatabase() {
  let connection;

  try {
    console.log('🔧 Conectando a la base de datos...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'restaurante_escolar_db',
      multipleStatements: true
    });

    console.log('✅ Conexión establecida\n');

    // ============================================
    // 1. ELIMINAR TODOS LOS DATOS
    // ============================================
    console.log('🗑️  PASO 1: Eliminando todos los datos...\n');

    // Desactivar verificaciones de foreign keys
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Truncar tablas en orden correcto (respetando relaciones)
    const tablesToTruncate = [
      'asistencias',
      'justificaciones',
      'acudientes',
      'estudiantes',
      'usuarios',
      'sesiones_trabajo',
      'configuracion_institucional'
    ];

    for (const table of tablesToTruncate) {
      try {
        await connection.query(`TRUNCATE TABLE ${table}`);
        console.log(`   ✓ Tabla "${table}" limpiada`);
      } catch (error) {
        console.log(`   ⚠️  Error limpiando "${table}":`, error.message);
      }
    }

    // Reactivar verificaciones
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n✅ Todos los datos eliminados\n');

    // ============================================
    // 2. CREAR USUARIOS BÁSICOS DEL SISTEMA
    // ============================================
    console.log('👥 PASO 2: Creando usuarios básicos del sistema...\n');

    // Contraseña por defecto para todos (hasheada)
    const defaultPassword = await bcrypt.hash('123456', 12);

    const usuarios = [
      {
        email: 'admin@iestudent.edu.co',
        matricula: 'ADMIN001',
        rol: 'admin',
        estado: 'validado'
      },
      {
        email: 'secretaria@iestudent.edu.co',
        matricula: 'SEC001',
        rol: 'secretaria',
        estado: 'validado'
      },
      {
        email: 'coordinacion@iestudent.edu.co',
        matricula: 'COORD001',
        rol: 'coordinador_convivencia',
        estado: 'validado'
      },
      {
        email: 'alfabetizador@iestudent.edu.co',
        matricula: 'ALF001',
        rol: 'alfabetizador',
        estado: 'validado'
      },
      {
        email: 'docente@iestudent.edu.co',
        matricula: 'DOC001',
        rol: 'docente',
        estado: 'validado'
      },
      {
        email: 'estudiante@iestudent.edu.co',
        matricula: 'EST001',
        rol: 'estudiante',
        estado: 'validado',
        // Datos del estudiante (para tabla estudiantes)
        nombre: 'Estudiante',
        apellidos: 'de Ejemplo',
        grado: '6A',
        jornada: 'Mañana'
      }
    ];

    for (const usuario of usuarios) {
      const [result] = await connection.query(
        `INSERT INTO usuarios (
          email, matricula, password, rol, estado, fecha_registro
        ) VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          usuario.email,
          usuario.matricula,
          defaultPassword,
          usuario.rol,
          usuario.estado
        ]
      );

      console.log(`   ✓ Usuario creado: ${usuario.rol.toUpperCase().padEnd(25)} - ${usuario.matricula}`);

      // Si es estudiante, crear registro en tabla estudiantes
      if (usuario.rol === 'estudiante') {
        await connection.query(
          `INSERT INTO estudiantes (
            usuario_id, matricula, nombre, apellidos, fecha_nacimiento, 
            grado, jornada, estrato, prioridad
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 2, 1)`,
          [
            result.insertId, 
            usuario.matricula, 
            usuario.nombre, 
            usuario.apellidos, 
            '2010-01-01',  // Fecha de nacimiento por defecto
            usuario.grado, 
            'mañana'  // Jornada en minúscula según ENUM
          ]
        );
        console.log(`      ↳ Registro de estudiante creado (Grado: ${usuario.grado}, Jornada: Mañana)`);
      }
    }

    console.log('\n✅ Usuarios básicos creados exitosamente\n');

    // ============================================
    // 3. CREAR CONFIGURACIÓN INSTITUCIONAL
    // ============================================
    console.log('⚙️  PASO 3: Creando configuración institucional...\n');

    await connection.query(`
      INSERT INTO configuracion_institucional (
        nombre_institucion,
        direccion,
        telefono,
        nit,
        rector,
        coordinador,
        email,
        limite_cupos_restaurante,
        logo_url
      ) VALUES (
        'I.E. San Antonio de Prado',
        'Cra. 77, 41 sur #02',
        '3004154444',
        '901240123-4',
        'Rector General',
        'Coordinador Académico',
        'contacto@iestudent.edu.co',
        270,
        '/assets/images/logo-institucion.png'
      )
    `);

    console.log('   ✓ Configuración institucional creada\n');

    // ============================================
    // 4. RESUMEN FINAL
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ BASE DE DATOS LIMPIADA Y CONFIGURADA EXITOSAMENTE');
    console.log('='.repeat(60));
    
    console.log('\n📋 USUARIOS CREADOS:\n');
    console.log('   ROL                      | MATRÍCULA | EMAIL');
    console.log('   ' + '-'.repeat(70));
    console.log('   Administrador            | ADMIN001  | admin@iestudent.edu.co');
    console.log('   Secretaria               | SEC001    | secretaria@iestudent.edu.co');
    console.log('   Coordinador Convivencia  | COORD001  | coordinacion@iestudent.edu.co');
    console.log('   Alfabetizador            | ALF001    | alfabetizador@iestudent.edu.co');
    console.log('   Docente                  | DOC001    | docente@iestudent.edu.co');
    console.log('   Estudiante (6A - Mañana) | EST001    | estudiante@iestudent.edu.co');
    
    console.log('\n🔑 CREDENCIALES DE ACCESO:\n');
    console.log('   Usuario: [MATRÍCULA del usuario]');
    console.log('   Contraseña: 123456');
    
    console.log('\n💡 EJEMPLOS DE LOGIN:\n');
    console.log('   Admin:         ADMIN001 / 123456');
    console.log('   Secretaria:    SEC001 / 123456');
    console.log('   Coordinación:  COORD001 / 123456');
    console.log('   Alfabetizador: ALF001 / 123456');
    console.log('   Docente:       DOC001 / 123456');
    console.log('   Estudiante:    EST001 / 123456');
    
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDetalles del error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar script
console.log('\n' + '='.repeat(60));
console.log('🚨 ADVERTENCIA: ESTE SCRIPT ELIMINARÁ TODOS LOS DATOS');
console.log('='.repeat(60));
console.log('\nIniciando en 3 segundos...\n');

setTimeout(() => {
  resetDatabase().then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  });
}, 3000);
