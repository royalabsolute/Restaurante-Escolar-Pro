const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurante_escolar_db'
};

const DEFAULT_PASSWORD = '12345@';
const USERS_BY_ROLE = [
  { email: 'admin@restaurante.com', role: 'admin', matricula: 'ADM-REST-001' },
  { email: 'secretaria@restaurante.com', role: 'secretaria', matricula: 'SEC-REST-001' },
  { email: 'coordinador@restaurante.com', role: 'coordinador_convivencia', matricula: 'COORD-REST-001' },
  { email: 'alfabetizador@restaurante.com', role: 'alfabetizador', matricula: 'ALF-REST-001' },
  { email: 'docente@restaurante.com', role: 'docente', matricula: 'DOC-REST-001' },
  { email: 'estudiante@restaurante.com', role: 'estudiante', matricula: 'EST-REST-001' }
];

async function upsertUser(connection, user, hashedPassword) {
  const [existing] = await connection.query(
    'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
    [user.email]
  );

  if (existing.length > 0) {
    const userId = existing[0].id;
    await connection.query(
      `UPDATE usuarios
         SET password = ?, rol = ?, matricula = ?, estado = 'validado',
             motivo_rechazo = NULL, motivo_suspension = NULL
       WHERE id = ?`,
      [hashedPassword, user.role, user.matricula, userId]
    );
    console.log(`✏️ Usuario actualizado: ${user.email} (${user.role})`);
    return { action: 'updated', email: user.email, role: user.role };
  }

  await connection.query(
    `INSERT INTO usuarios (email, matricula, password, rol, estado)
     VALUES (?, ?, ?, ?, 'validado')`,
    [user.email, user.matricula, hashedPassword, user.role]
  );
  console.log(`✅ Usuario creado: ${user.email} (${user.role})`);
  return { action: 'created', email: user.email, role: user.role };
}

async function main() {
  let connection;
  try {
    console.log('🔗 Conectando a la base de datos...');
    connection = await mysql.createConnection(config);

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    const results = [];

    for (const user of USERS_BY_ROLE) {
      // Actualizar o crear siempre basado en el email configurado.
      const result = await upsertUser(connection, user, hashedPassword);
      results.push(result);
    }

    console.log('\n🧾 Resumen de operaciones:');
    for (const { action, email, role } of results) {
      console.log(` - ${action === 'created' ? 'Creado ' : 'Actualizado '}(${role}) ${email}`);
    }

    console.log('\n🎉 Usuarios por rol configurados con éxito.');
  } catch (error) {
    console.error('❌ Error configurando usuarios por rol:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

main();
