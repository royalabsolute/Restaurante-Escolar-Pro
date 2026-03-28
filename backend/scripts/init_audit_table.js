const database = require('../src/config/database');

async function initAuditTable() {
    try {
        console.log('Verificando tabla de auditoría...');

        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS auditoria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        accion VARCHAR(255) NOT NULL,
        tabla_afectada VARCHAR(100),
        detalles TEXT,
        ip_direccion VARCHAR(45),
        fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `;

        await database.query(createTableQuery);
        console.log('✅ Tabla `auditoria` verificada/creada correctamente.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al inicializar tabla de auditoría:', error);
        process.exit(1);
    }
}

initAuditTable();
