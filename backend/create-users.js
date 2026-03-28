const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const roles = [
    'admin', 'secretaria', 'coordinador_estudiantil', 'coordinador_convivencia',
    'docente', 'psicorientacion', 'alfabetizador', 'estudiante', 'acudiente',
    'invitado', 'escaner'
];

const passwordPlain = 'Mega1321@';

async function createUsers() {
    console.log('--- Creando usuarios para todos los roles ---');
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'restaurante_escolar_db'
    };

    let connection;
    try {
        connection = await mysql.createConnection(config);
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(passwordPlain, saltRounds);

        for (const rol of roles) {
            const email = `${rol}@sadep.com`;
            console.log(`Procesando: ${email} (${rol})...`);

            // Eliminar si ya existe para evitar errores de duplicado
            await connection.execute('DELETE FROM usuarios WHERE email = ?', [email]);

            const isDeletable = rol !== 'alfabetizador';
            const [result] = await connection.execute(
                'INSERT INTO usuarios (email, password, rol, estado, matricula, is_deletable) VALUES (?, ?, ?, ?, ?, ?)',
                [email, hashedPassword, rol, 'validado', `MAT-${rol.toUpperCase()}`, isDeletable]
            );

            const userId = result.insertId;

            if (rol === 'alfabetizador') {
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 24);
                await connection.execute('UPDATE usuarios SET expires_at = ? WHERE id = ?', [expiresAt, userId]);
            }

            // Si es estudiante, crear entrada en la tabla estudiantes
            if (rol === 'estudiante') {
                const qr = `QR_AUTO_${rol}_${Date.now()}`;
                await connection.execute('DELETE FROM estudiantes WHERE usuario_id = ?', [userId]);
                await connection.execute(
                    'INSERT INTO estudiantes (usuario_id, nombre, apellidos, fecha_nacimiento, estrato, codigo_qr, prioridad) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [userId, 'Usuario', 'Estudiante Test', '2010-01-01', 3, qr, 3]
                );
            }
            
            console.log(`✅ Creado: ${email}`);
        }

        console.log('\n--- Finalizado con éxito ---');

    } catch (error) {
        console.error('❌ Error creando usuarios:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

createUsers();
