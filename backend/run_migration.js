require('dotenv').config({ path: './.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'restaurante_escolar_db'
};

async function runMigration() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        const migrationSQL = fs.readFileSync(path.join(__dirname, 'migrations', 'migration_guest.sql'), 'utf8');
        console.log('Executing migration...');

        // Split by semicolon to handle multiple statements if any (though here it's just one ALTER)
        const statements = migrationSQL.split(';').filter(s => s.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
                console.log('Executed:', statement.substring(0, 50) + '...');
            }
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist. Skipping.');
        } else {
            console.error('Migration failed:', error);
        }
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();
