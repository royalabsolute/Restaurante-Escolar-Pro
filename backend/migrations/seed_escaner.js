/**
 * Seed: Crear usuario universal de escáner con contraseña hasheada
 * Ejecutar con: node backend/migrations/seed_escaner.js
 */
const bcrypt = require('bcrypt');
const database = require('../src/config/database');

async function seedEscaner() {
    try {
        // Verificar si ya existe
        const existing = await database.query(
            "SELECT id FROM usuarios WHERE rol = 'escaner' LIMIT 1"
        );

        if (existing && existing.length > 0) {
            console.log('✅ Usuario escáner ya existe (ID:', existing[0].id, ')');
            process.exit(0);
        }

        // Crear con contraseña hasheada
        const password = 'escaner2024';
        const hash = await bcrypt.hash(password, 12);

        await database.query(
            `INSERT INTO usuarios (email, password, matricula, rol, estado, fecha_registro) 
       VALUES (?, ?, 'ESCANER-001', 'escaner', 'validado', NOW())`,
            ['escaner@restaurante.local', hash]
        );

        console.log('✅ Usuario escáner creado exitosamente');
        console.log('   Email: escaner@restaurante.local');
        console.log('   Contraseña: escaner2024');
        console.log('   Rol: escaner');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creando usuario escáner:', error.message);
        process.exit(1);
    }
}

seedEscaner();
