// models/InstitucionConfig.js
const db = require('../config/database');

const normalizarHora = (valor, defecto) => {
    if (valor === undefined || valor === null || valor === '') {
        return defecto;
    }

    const hora = String(valor);

    if (/^\d{2}:\d{2}:\d{2}$/.test(hora)) {
        return hora;
    }

    if (/^\d{2}:\d{2}$/.test(hora)) {
        return `${hora}:00`;
    }

    return defecto;
};

class InstitucionConfig {
    static async obtenerConfiguracion() {
        try {
            const rows = await db.query(
                'SELECT * FROM configuracion_institucional ORDER BY id DESC LIMIT 1'
            );

            if (!rows || rows.length === 0) {
                // Datos por defecto si no existe configuración
                return {
                    nombre_institucion: 'Institución Educativa San Antonio de Prado',
                    direccion: 'Cra. 77, 41 sur #02',
                    telefono: '3004154444',
                    nit: '901240123-4',
                    rector: 'Jhon Freddy',
                    coordinador: 'Don Edgar',
                    email: 'contacto@iesanantoniodeprado.edu.co',
                    logo_url: '/assets/images/iesadep.png',
                    limite_cupos_restaurante: 270,
                    horario_valido_inicio: '11:00:00',
                    horario_valido_fin: '15:00:00',
                    vencimiento_invitado_horas: 24
                };
            }

            const config = rows[0];
            config.horario_valido_inicio = normalizarHora(config.horario_valido_inicio, '11:00:00');
            config.horario_valido_fin = normalizarHora(config.horario_valido_fin, '15:00:00');

            return config;
        } catch (error) {
            console.error('Error al obtener configuración institucional:', error);
            throw error;
        }
    }

    static async actualizarConfiguracion(datos) {
        try {
            const {
                nombre_institucion,
                direccion,
                telefono,
                nit,
                rector,
                coordinador,
                email,
                logo_url,
                limite_cupos_restaurante,
                horario_valido_inicio,
                horario_valido_fin,
                vencimiento_invitado_horas
            } = datos;

            // Verificar si ya existe un registro
            const existingRows = await db.query(
                'SELECT id FROM configuracion_institucional ORDER BY id DESC LIMIT 1'
            );

            if (existingRows && existingRows.length > 0) {
                // Actualizar el registro existente
                const updates = [];
                const values = [];

                if (nombre_institucion !== undefined) {
                    updates.push('nombre_institucion = ?');
                    values.push(nombre_institucion);
                }
                if (direccion !== undefined) {
                    updates.push('direccion = ?');
                    values.push(direccion);
                }
                if (telefono !== undefined) {
                    updates.push('telefono = ?');
                    values.push(telefono);
                }
                if (nit !== undefined) {
                    updates.push('nit = ?');
                    values.push(nit);
                }
                if (rector !== undefined) {
                    updates.push('rector = ?');
                    values.push(rector);
                }
                if (coordinador !== undefined) {
                    updates.push('coordinador = ?');
                    values.push(coordinador);
                }
                if (email !== undefined) {
                    updates.push('email = ?');
                    values.push(email);
                }
                if (logo_url !== undefined) {
                    updates.push('logo_url = ?');
                    values.push(logo_url);
                }
                if (limite_cupos_restaurante !== undefined) {
                    updates.push('limite_cupos_restaurante = ?');
                    values.push(limite_cupos_restaurante);
                }
                if (horario_valido_inicio !== undefined) {
                    updates.push('horario_valido_inicio = ?');
                    values.push(normalizarHora(horario_valido_inicio, '11:00:00'));
                }
                if (horario_valido_fin !== undefined) {
                    updates.push('horario_valido_fin = ?');
                    values.push(normalizarHora(horario_valido_fin, '15:00:00'));
                }
                if (vencimiento_invitado_horas !== undefined) {
                    updates.push('vencimiento_invitado_horas = ?');
                    values.push(vencimiento_invitado_horas);
                }

                updates.push('updated_at = CURRENT_TIMESTAMP');
                values.push(existingRows[0].id);

                await db.query(`
                    UPDATE configuracion_institucional SET
                    ${updates.join(', ')}
                    WHERE id = ?
                `, values);
            } else {
                // Crear nuevo registro
                await db.query(`
                    INSERT INTO configuracion_institucional 
                    (nombre_institucion, direccion, telefono, nit, rector, coordinador, email, logo_url, limite_cupos_restaurante, horario_valido_inicio, horario_valido_fin)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    nombre_institucion,
                    direccion,
                    telefono,
                    nit,
                    rector,
                    coordinador,
                    email,
                    logo_url,
                    limite_cupos_restaurante || 270,
                    normalizarHora(horario_valido_inicio, '11:00:00'),
                    normalizarHora(horario_valido_fin, '15:00:00'),
                    vencimiento_invitado_horas || 24
                ]);
            }

            return await this.obtenerConfiguracion();
        } catch (error) {
            console.error('Error al actualizar configuración institucional:', error);
            throw error;
        }
    }

    // Obtener el conteo actual de estudiantes registrados (validados)
    static async obtenerConteoEstudiantes() {
        try {
            const rows = await db.query(
                'SELECT COUNT(*) as total FROM usuarios WHERE rol = "estudiante" AND estado = "validado"'
            );

            return rows[0]?.total || 0;
        } catch (error) {
            console.error('Error al obtener conteo de estudiantes:', error);
            throw error;
        }
    }

    // Actualizar solo el límite de cupos
    static async actualizarLimiteCupos(opciones) {
        try {
            const { limite, horarioInicio, horarioFin } = typeof opciones === 'object'
                ? {
                    limite: opciones.limite_cupos_restaurante ?? opciones.limite,
                    horarioInicio: normalizarHora(
                        opciones.horario_valido_inicio ?? opciones.horarioInicio,
                        undefined
                    ),
                    horarioFin: normalizarHora(
                        opciones.horario_valido_fin ?? opciones.horarioFin,
                        undefined
                    )
                }
                : { limite: opciones, horarioInicio: undefined, horarioFin: undefined };

            const existingRows = await db.query(
                'SELECT id FROM configuracion_institucional ORDER BY id DESC LIMIT 1'
            );

            if (existingRows && existingRows.length > 0) {
                const updates = ['updated_at = CURRENT_TIMESTAMP'];
                const values = [];

                if (limite !== undefined) {
                    updates.unshift('limite_cupos_restaurante = ?');
                    values.unshift(limite);
                }
                if (horarioInicio !== undefined) {
                    updates.unshift('horario_valido_inicio = ?');
                    values.unshift(horarioInicio);
                }
                if (horarioFin !== undefined) {
                    updates.unshift('horario_valido_fin = ?');
                    values.unshift(horarioFin);
                }

                values.push(existingRows[0].id);

                await db.query(`
                    UPDATE configuracion_institucional 
                    SET ${updates.join(', ')}
                    WHERE id = ?
                `, values);
            } else {
                // Si no existe configuración, crear una con valores por defecto
                await db.query(`
                    INSERT INTO configuracion_institucional 
                    (nombre_institucion, direccion, telefono, nit, rector, coordinador, email, logo_url, limite_cupos_restaurante, horario_valido_inicio, horario_valido_fin)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    'Institución Educativa San Antonio de Prado',
                    'Cra. 77, 41 sur #02',
                    '3004154444',
                    '901240123-4',
                    'Jhon Freddy',
                    'Don Edgar',
                    'contacto@iesanantoniodeprado.edu.co',
                    '/assets/images/iesadep.png',
                    limite || 270,
                    normalizarHora(horarioInicio, '11:00:00'),
                    normalizarHora(horarioFin, '15:00:00')
                ]);
            }

            return await this.obtenerConfiguracion();
        } catch (error) {
            console.error('Error al actualizar límite de cupos:', error);
            throw error;
        }
    }
}

module.exports = InstitucionConfig;
