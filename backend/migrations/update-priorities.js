const database = require('./src/config/database');

async function updateDatabaseStructure() {
  try {
    console.log('🔄 Actualizando estructura de base de datos...');
    
    // Agregar campo prioridad si no existe
    try {
      await database.query(`
        ALTER TABLE estudiantes 
        ADD COLUMN prioridad INT DEFAULT 5 COMMENT 'Prioridad del estudiante: 1=Máxima, 5=Mínima'
      `);
      console.log('✅ Campo prioridad agregado');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Campo prioridad ya existe');
      } else {
        throw error;
      }
    }
    
    // Función para calcular prioridad
    function calculatePriority(grupo_etnico, grado, es_desplazado) {
      let prioridad = 5;
      
      // Prioridad por grupo étnico
      switch (grupo_etnico) {
        case 'indigena':
          prioridad = 1;
          break;
        case 'afrodescendiente':
        case 'rom':
        case 'raizal':
        case 'palenquero':
          prioridad = 2;
          break;
        default:
          prioridad = 3;
      }
      
      // Bonificación por desplazamiento
      if (es_desplazado) {
        prioridad = Math.max(1, prioridad - 1);
      }
      
      // Grados con prioridad máxima
      const gradosPrioridadMaxima = [
        'preescolar-1', 'preescolar-2', 'preescolar-3', 'preescolar-4',
        'transicion-1', 'transicion-2', 'transicion-3', 'transicion-4',
        '1', '2', '3', '10-1', '11-1'
      ];
      
      if (gradosPrioridadMaxima.includes(grado)) {
        prioridad = 1;
      }
      
      return prioridad;
    }
    
    // Obtener todos los estudiantes y actualizar prioridades
    const estudiantes = await database.query('SELECT id, grupo_etnico, grado, es_desplazado FROM estudiantes');
    
    console.log(`📊 Actualizando prioridades para ${estudiantes.length} estudiantes...`);
    
    for (const estudiante of estudiantes) {
      const nuevaPrioridad = calculatePriority(
        estudiante.grupo_etnico || 'ninguno',
        estudiante.grado || 'Sin asignar',
        estudiante.es_desplazado
      );
      
      await database.query(
        'UPDATE estudiantes SET prioridad = ? WHERE id = ?',
        [nuevaPrioridad, estudiante.id]
      );
    }
    
    // Crear índice para optimizar consultas
    try {
      await database.query(`
        CREATE INDEX idx_estudiantes_prioridad ON estudiantes(prioridad, grado, grupo_etnico)
      `);
      console.log('✅ Índice de prioridad creado');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Índice de prioridad ya existe');
      } else {
        console.log('⚠️ Error creando índice:', error.message);
      }
    }
    
    // Mostrar estadísticas
    const stats = await database.query(`
      SELECT 
        prioridad,
        COUNT(*) as cantidad,
        GROUP_CONCAT(DISTINCT grupo_etnico) as grupos_etnicos,
        GROUP_CONCAT(DISTINCT grado) as grados
      FROM estudiantes 
      GROUP BY prioridad 
      ORDER BY prioridad
    `);
    
    console.log('📈 Estadísticas de prioridades:');
    stats.forEach(stat => {
      console.log(`   Prioridad ${stat.prioridad}: ${stat.cantidad} estudiantes`);
    });
    
    console.log('✅ Actualización de base de datos completada');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error actualizando base de datos:', error);
    process.exit(1);
  }
}

updateDatabaseStructure();
