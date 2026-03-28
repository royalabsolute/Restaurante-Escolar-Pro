const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function migrate() {
    console.log('--- Iniciando Migración de Base de Datos ---');
    
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    let connection;
    try {
        console.log(`Conectando a MariaDB como ${config.user}...`);
        connection = await mysql.createConnection(config);
        
        const dbName = process.env.DB_NAME || 'restaurante_escolar_db';
        
        console.log(`Eliminando base de datos antigua: ${dbName} (si existe)`);
        await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
        
        console.log(`Creando base de datos fresca: ${dbName}`);
        await connection.query(`CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
        
        console.log(`Seleccionando base de datos: ${dbName}`);
        await connection.query(`USE ${dbName}`);
        
        const sqlPath = path.join(__dirname, 'database/restaurante_escolar_db.sql');
        console.log(`Leyendo archivo SQL: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Ejecutando script SQL... (esto puede tardar unos segundos)');
        await connection.query(sql);
        
        console.log('✅ Migración completada exitosamente.');
        
    } catch (error) {
        console.error('❌ Error durante la migración:');
        console.error(error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Sugerencia: Verifica que MariaDB permita el acceso al usuario root sin contraseña o con la contraseña del .env');
        }
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
