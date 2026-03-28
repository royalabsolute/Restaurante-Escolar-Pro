const database = require('../src/config/database');

async function fixTable() {
    try {
        console.log('🔍 Verificando estructura de la tabla justificaciones...');

        // Verificar si la columna ya existe
        const columns = await database.query("SHOW COLUMNS FROM justificaciones LIKE 'descripcion'");

        if (columns.length === 0) {
            console.log('➕ Añadiendo columna "descripcion" a la tabla justificaciones...');
            await database.query("ALTER TABLE justificaciones ADD COLUMN descripcion TEXT AFTER motivo");
            console.log('✅ Columna "descripcion" añadida exitosamente');
        } else {
            console.log('ℹ️ La columna "descripcion" ya existe');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error actualizando la tabla:', error);
        process.exit(1);
    }
}

fixTable();
