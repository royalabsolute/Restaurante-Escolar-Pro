const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'restaurante_escolar_db'
};

async function addSampleData() {
  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log('🔗 Conectado a la base de datos');

    // Agregar más actividades del sistema
    const activities = [
      {
        activity_type: 'STUDENT_SCAN',
        description: 'Estudiante escaneo código QR para almuerzo',
        user_role: 'estudiante'
      },
      {
        activity_type: 'ADMIN_LOGIN',
        description: 'Administrador inició sesión en el sistema',
        user_role: 'admin'
      },
      {
        activity_type: 'JUSTIFICATION_APPROVED',
        description: 'Justificación de ausencia aprobada',
        user_role: 'secretary'
      },
      {
        activity_type: 'REPORT_GENERATED',
        description: 'Reporte de asistencia diaria generado',
        user_role: 'admin'
      },
      {
        activity_type: 'QR_TEST_STARTED',
        description: 'Sesión de prueba QR iniciada',
        user_role: 'admin'
      },
      {
        activity_type: 'STUDENT_REGISTERED',
        description: 'Nuevo estudiante registrado en el sistema',
        user_role: 'secretary'
      }
    ];

    // Insertar actividades con diferentes tiempos
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      const minutesAgo = Math.floor(Math.random() * 120); // Últimas 2 horas
      const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000);
      
      await connection.execute(
        'INSERT INTO system_activities (activity_type, description, user_role, created_at) VALUES (?, ?, ?, ?)',
        [activity.activity_type, activity.description, activity.user_role, timestamp]
      );
      
      console.log(`✅ Actividad agregada: ${activity.description}`);
    }

    // Agregar algunas asistencias de hoy para que las estadísticas sean más realistas
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];
    
    // Obtener algunos estudiantes existentes y un usuario válido para registrado_por
    const [students] = await connection.execute('SELECT id FROM estudiantes LIMIT 5');
    const [users] = await connection.execute('SELECT id FROM usuarios WHERE rol IN ("admin", "secretary") LIMIT 1');
    
    if (students.length > 0 && users.length > 0) {
      const registradoPor = users[0].id;
      
      for (let i = 0; i < Math.min(3, students.length); i++) {
        const student = students[i];
        const hours = 7 + Math.floor(Math.random() * 2); // Entre 7:00 y 8:59
        const minutes = Math.floor(Math.random() * 60);
        const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        
        // Verificar si ya existe una asistencia hoy para este estudiante
        const [existing] = await connection.execute(
          'SELECT id FROM asistencias WHERE estudiante_id = ? AND fecha = ?',
          [student.id, today]
        );
        
        if (existing.length === 0) {
          await connection.execute(
            'INSERT INTO asistencias (estudiante_id, fecha, hora_entrada, metodo_registro, registrado_por, validado) VALUES (?, ?, ?, ?, ?, ?)',
            [student.id, today, time, 'escaner', registradoPor, 1]
          );
          
          console.log(`✅ Asistencia agregada para estudiante ${student.id} a las ${time}`);
        }
      }
    }

    console.log('🎉 Datos de ejemplo agregados exitosamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

addSampleData();
