/**
 * Migration: Grupos Académicos y Tabla de Docentes
 * Crea la tabla grupos_academicos, agrega campos a usuarios (cedula, telefono),
 * y agrega grupo_academico_id a la tabla estudiantes.
 */
const database = require('../src/config/database');

const migration = async () => {
    const connection = await database.getConnection();
    try {
        await connection.beginTransaction();

        console.log('🔧 Iniciando migración: Grupos Académicos...');

        // 1. Crear tabla grupos_academicos
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS grupos_academicos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        jornada ENUM('Mañana', 'Tarde', 'Completa') NOT NULL DEFAULT 'Mañana',
        activo TINYINT(1) NOT NULL DEFAULT 1,
        director_grupo_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (director_grupo_id) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        console.log('  ✅ Tabla grupos_academicos creada');

        // 2. Agregar columna grupo_academico_id a estudiantes (si no existe)
        const [cols] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'estudiantes' AND COLUMN_NAME = 'grupo_academico_id'
    `);
        if (cols.length === 0) {
            await connection.execute(`
        ALTER TABLE estudiantes
        ADD COLUMN grupo_academico_id INT NULL AFTER grado,
        ADD CONSTRAINT fk_est_grupo FOREIGN KEY (grupo_academico_id) REFERENCES grupos_academicos(id) ON DELETE SET NULL ON UPDATE CASCADE
      `);
            console.log('  ✅ Columna grupo_academico_id agregada a estudiantes');
        } else {
            console.log('  ⏭️  Columna grupo_academico_id ya existe en estudiantes');
        }

        // 3. Agregar campos cedula y telefono a usuarios (si no existen)
        const [cedCol] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'cedula'
    `);
        if (cedCol.length === 0) {
            await connection.execute(`
        ALTER TABLE usuarios
        ADD COLUMN cedula VARCHAR(20) NULL AFTER email,
        ADD COLUMN telefono VARCHAR(20) NULL AFTER cedula
      `);
            console.log('  ✅ Columnas cedula y telefono agregadas a usuarios');
        } else {
            console.log('  ⏭️  Columna cedula ya existe en usuarios');
        }

        // 4. Poblar grupos_academicos con los datos existentes en config/grados.js
        const gradosBase = [
            { nombre: 'Transición 1', jornada: 'Mañana' },
            { nombre: 'Transición 2', jornada: 'Mañana' },
            { nombre: 'Transición 3', jornada: 'Mañana' },
            { nombre: 'Transición 4', jornada: 'Tarde' },
            { nombre: 'Transición 5', jornada: 'Tarde' },
            { nombre: 'Transición 6', jornada: 'Tarde' },
            { nombre: '6°1', jornada: 'Mañana' },
            { nombre: '6°2', jornada: 'Mañana' },
            { nombre: '6°3', jornada: 'Mañana' },
            { nombre: '6°4', jornada: 'Tarde' },
            { nombre: '6°5', jornada: 'Tarde' },
            { nombre: '6°6', jornada: 'Tarde' },
            { nombre: '10°1', jornada: 'Mañana' },
            { nombre: '10°2', jornada: 'Mañana' },
            { nombre: '10°3', jornada: 'Mañana' },
            { nombre: '10°4', jornada: 'Tarde' },
            { nombre: '10°5', jornada: 'Tarde' },
            { nombre: '10°6', jornada: 'Tarde' },
            { nombre: '11°1', jornada: 'Mañana' },
            { nombre: '11°2', jornada: 'Mañana' },
            { nombre: '11°3', jornada: 'Mañana' },
            { nombre: '11°4', jornada: 'Tarde' },
            { nombre: '11°5', jornada: 'Tarde' },
            { nombre: '11°6', jornada: 'Tarde' },
        ];

        for (const g of gradosBase) {
            try {
                await connection.execute(
                    `INSERT IGNORE INTO grupos_academicos (nombre, jornada) VALUES (?, ?)`,
                    [g.nombre, g.jornada]
                );
            } catch {
                // Ignorar duplicados
            }
        }
        console.log('  ✅ Grupos base insertados (o ya existían)');

        await connection.commit();
        console.log('\n✅ Migración completada exitosamente.');
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error en migración:', error.message);
        throw error;
    } finally {
        connection.release();
        process.exit(0);
    }
};

migration();
