const database = require('../src/config/database');

/**
 * Health check script para verificar el estado del sistema
 * Ejecutar con: node scripts/health-check.js
 */

async function healthCheck() {
  const results = {
    timestamp: new Date().toISOString(),
    status: 'unknown',
    checks: {
      database: { status: 'unknown', details: null },
      server: { status: 'unknown', details: null },
      dependencies: { status: 'unknown', details: null }
    }
  };

  console.log('🏥 Ejecutando health check del sistema...\n');

  // Check 1: Base de datos
  try {
    console.log('🔍 Verificando conexión a base de datos...');
    const dbTest = await database.query('SELECT 1 as test, NOW() as timestamp');
    
    if (dbTest && dbTest.length > 0) {
      results.checks.database = {
        status: 'healthy',
        details: {
          connected: true,
          timestamp: dbTest[0].timestamp,
          response_time: Date.now()
        }
      };
      console.log('✅ Base de datos: CONECTADA');
    } else {
      throw new Error('Respuesta inválida de la base de datos');
    }
  } catch (error) {
    results.checks.database = {
      status: 'unhealthy',
      details: {
        error: error.message,
        connected: false
      }
    };
    console.log('❌ Base de datos: ERROR -', error.message);
  }

  // Check 2: Tablas principales
  try {
    console.log('🔍 Verificando estructura de base de datos...');
    const tables = await database.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);
    
    const requiredTables = [
      'usuarios', 'estudiantes', 'asistencias', 'justificaciones',
      'acudientes', 'configuraciones', 'auditoria', 'suplentes'
    ];
    
    const existingTables = tables.map(t => t.TABLE_NAME);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length === 0) {
      results.checks.database.details.tables = {
        status: 'complete',
        count: existingTables.length,
        required: requiredTables.length
      };
      console.log('✅ Estructura de BD: COMPLETA');
    } else {
      results.checks.database.details.tables = {
        status: 'incomplete',
        missing: missingTables,
        count: existingTables.length,
        required: requiredTables.length
      };
      console.log('⚠️  Estructura de BD: INCOMPLETA - Faltan:', missingTables.join(', '));
    }
  } catch (error) {
    console.log('❌ Error verificando estructura:', error.message);
  }

  // Check 3: Usuarios del sistema
  try {
    console.log('🔍 Verificando usuarios del sistema...');
    const userCounts = await database.query(`
      SELECT 
        rol,
        COUNT(*) as count,
        SUM(CASE WHEN estado = 'validado' THEN 1 ELSE 0 END) as validated
      FROM usuarios 
      GROUP BY rol
    `);
    
    results.checks.database.details.users = userCounts.reduce((acc, row) => {
      acc[row.rol] = {
        total: row.count,
        validated: row.validated
      };
      return acc;
    }, {});
    
    console.log('✅ Usuarios encontrados:');
    userCounts.forEach(row => {
      console.log(`   ${row.rol}: ${row.validated}/${row.count} validados`);
    });
  } catch (error) {
    console.log('❌ Error verificando usuarios:', error.message);
  }

  // Check 4: Variables de entorno
  try {
    console.log('🔍 Verificando configuración...');
    const requiredEnvVars = [
      'DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    results.checks.dependencies = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
      details: {
        environment: process.env.NODE_ENV || 'development',
        missing_vars: missingEnvVars,
        port: process.env.PORT || 5000
      }
    };
    
    if (missingEnvVars.length === 0) {
      console.log('✅ Variables de entorno: COMPLETAS');
    } else {
      console.log('❌ Variables faltantes:', missingEnvVars.join(', '));
    }
  } catch (error) {
    console.log('❌ Error verificando configuración:', error.message);
  }

  // Check 5: Estado del servidor
  try {
    console.log('🔍 Verificando estado del servidor...');
    const startTime = process.hrtime();
    
    // Simular carga de trabajo
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const responseTime = seconds * 1000 + nanoseconds / 1000000;
    
    results.checks.server = {
      status: 'healthy',
      details: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        response_time: responseTime,
        node_version: process.version,
        platform: process.platform
      }
    };
    
    console.log('✅ Servidor: OPERATIVO');
    console.log(`   Uptime: ${Math.floor(process.uptime())} segundos`);
    console.log(`   Memoria: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`);
  } catch (error) {
    results.checks.server = {
      status: 'unhealthy',
      details: { error: error.message }
    };
    console.log('❌ Servidor: ERROR -', error.message);
  }

  // Determinar estado general
  const allChecks = Object.values(results.checks);
  const healthyChecks = allChecks.filter(check => check.status === 'healthy').length;
  const totalChecks = allChecks.length;
  
  if (healthyChecks === totalChecks) {
    results.status = 'healthy';
    console.log('\n🟢 ESTADO GENERAL: SISTEMA SALUDABLE');
  } else if (healthyChecks > 0) {
    results.status = 'partial';
    console.log('\n🟡 ESTADO GENERAL: FUNCIONAMIENTO PARCIAL');
  } else {
    results.status = 'unhealthy';
    console.log('\n🔴 ESTADO GENERAL: SISTEMA CON PROBLEMAS');
  }

  console.log(`📊 Checks exitosos: ${healthyChecks}/${totalChecks}`);
  
  // Guardar resultados en archivo
  const fs = require('fs');
  const path = require('path');
  
  try {
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const healthFile = path.join(logsDir, 'health-check.json');
    fs.writeFileSync(healthFile, JSON.stringify(results, null, 2));
    console.log(`\n📝 Resultados guardados en: ${healthFile}`);
  } catch (error) {
    console.log('⚠️  No se pudo guardar el reporte:', error.message);
  }

  return results;
}

// Función para health check simple (solo estado)
async function quickHealthCheck() {
  try {
    await database.query('SELECT 1');
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  
  healthCheck()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Error en health check:', error);
      process.exit(1);
    });
}

module.exports = { healthCheck, quickHealthCheck };
