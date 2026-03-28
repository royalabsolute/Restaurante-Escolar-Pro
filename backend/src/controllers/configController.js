// controllers/configController.js
const InstitucionConfig = require('../models/InstitucionConfig');
const { sendSuccess, sendError } = require('../middleware/standardResponse');

const normalizarHorarioEntrada = (valor) => {
    if (!valor && valor !== '0') {
        return undefined;
    }

    const hora = String(valor).trim();

    if (/^\d{2}:\d{2}:\d{2}$/.test(hora)) {
        return hora;
    }

    if (/^\d{2}:\d{2}$/.test(hora)) {
        return `${hora}:00`;
    }

    return null;
};

const toDisplayTime = (valor, fallback = '00:00') => {
    if (!valor) {
        return fallback;
    }

    return String(valor).substring(0, 5);
};

class ConfigController {
    // Obtener configuración institucional
    static async obtenerConfiguracion(req, res) {
        try {
            const config = await InstitucionConfig.obtenerConfiguracion();
            return sendSuccess(res, config);
        } catch (error) {
            console.error('Error al obtener configuración:', error);
            return sendError(res, 'Error interno del servidor', 500);
        }
    }

    // Actualizar configuración institucional (solo admin)
    static async actualizarConfiguracion(req, res) {
        try {
            // Verificar que solo los admins puedan actualizar la configuración
            const { rol } = req.user;
            if (rol !== 'admin') {
                return sendError(res, 'No tienes permisos para realizar esta acción', 403);
            }

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
                horario_valido_fin
            } = req.body;

            // Validaciones básicas
            if (!nombre_institucion || !direccion || !telefono || !nit) {
                return sendError(res, 'Todos los campos obligatorios deben ser proporcionados', 400);
            }

            const horarioInicioNormalizado = normalizarHorarioEntrada(horario_valido_inicio);
            const horarioFinNormalizado = normalizarHorarioEntrada(horario_valido_fin);

            if (horario_valido_inicio && horarioInicioNormalizado === null) {
                return sendError(res, 'El formato de la hora de inicio debe ser HH:MM', 400);
            }

            if (horario_valido_fin && horarioFinNormalizado === null) {
                return sendError(res, 'El formato de la hora de fin debe ser HH:MM', 400);
            }

            const configActualizada = await InstitucionConfig.actualizarConfiguracion({
                nombre_institucion,
                direccion,
                telefono,
                nit,
                rector: rector || 'Jhon Freddy',
                coordinador: coordinador || 'Don Edgar',
                email: email || 'contacto@iesanantoniodeprado.edu.co',
                logo_url: logo_url || '/assets/images/iesadep.png',
                limite_cupos_restaurante,
                horario_valido_inicio: horarioInicioNormalizado ?? horario_valido_inicio,
                horario_valido_fin: horarioFinNormalizado ?? horario_valido_fin
            });

            return sendSuccess(res, configActualizada, 'Configuración actualizada exitosamente');

        } catch (error) {
            console.error('❌ Error al actualizar configuración:', error);
            return sendError(res, 'Error interno del servidor', 500);
        }
    }

    // Obtener estadísticas de cupos del restaurante
    static async obtenerEstadisticasCupos(req, res) {
        try {
            const configuracion = await InstitucionConfig.obtenerConfiguracion();
            const conteoActual = await InstitucionConfig.obtenerConteoEstudiantes();
            const limiteMaximo = configuracion.limite_cupos_restaurante || 270;
            const horarioValidoInicio = toDisplayTime(configuracion.horario_valido_inicio, '11:00');
            const horarioValidoFin = toDisplayTime(configuracion.horario_valido_fin, '15:00');

            const porcentajeOcupacion = Math.round((conteoActual / limiteMaximo) * 100);
            const cuposDisponibles = Math.max(0, limiteMaximo - conteoActual);

            return sendSuccess(res, {
                limiteMaximo,
                conteoActual,
                cuposDisponibles,
                porcentajeOcupacion,
                cuposCompletos: conteoActual >= limiteMaximo,
                horarioValidoInicio,
                horarioValidoFin
            });
        } catch (error) {
            console.error('❌ Error al obtener estadísticas de cupos:', error);
            return sendError(res, 'Error interno del servidor', 500);
        }
    }

    // Actualizar solo el límite de cupos y horarios
    static async actualizarLimiteCupos(req, res) {
        try {
            const {
                limite_cupos_restaurante,
                horario_valido_inicio,
                horario_valido_fin
            } = req.body;

            if (!limite_cupos_restaurante || limite_cupos_restaurante < 1) {
                return sendError(res, 'El límite de cupos debe ser un número mayor a 0', 400);
            }

            const horarioInicioNormalizado = normalizarHorarioEntrada(horario_valido_inicio);
            const horarioFinNormalizado = normalizarHorarioEntrada(horario_valido_fin);

            // Validar formato de hora (null = formato inválido, undefined = no enviado)
            if (horarioInicioNormalizado === null || horarioFinNormalizado === null) {
                return sendError(res, 'El formato de las horas válidas debe ser HH:MM', 400);
            }

            if (horarioInicioNormalizado && horarioFinNormalizado) {
                if (horarioInicioNormalizado === horarioFinNormalizado) {
                    return sendError(res, 'La hora de inicio y fin no pueden ser iguales', 400);
                }
            }

            const configActualizada = await InstitucionConfig.actualizarLimiteCupos({
                limite_cupos_restaurante,
                horario_valido_inicio: horarioInicioNormalizado,
                horario_valido_fin: horarioFinNormalizado
            });
            const conteoActual = await InstitucionConfig.obtenerConteoEstudiantes();

            return sendSuccess(res, {
                limiteMaximo: configActualizada.limite_cupos_restaurante,
                conteoActual,
                horarioValidoInicio: toDisplayTime(configActualizada.horario_valido_inicio, '11:00'),
                horarioValidoFin: toDisplayTime(configActualizada.horario_valido_fin, '15:00')
            }, 'Límite de cupos actualizado exitosamente');

        } catch (error) {
            console.error('❌ Error al actualizar límite de cupos:', error);
            return sendError(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = ConfigController;
