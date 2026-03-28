const InstitucionConfig = require('../models/InstitucionConfig');

/**
 * Valida si el momento actual está dentro del horario permitido configurado
 * @returns {Promise<{permitido: boolean, inicioLabel: string, finLabel: string}>}
 */
async function validarHorarioActual() {
    try {
        const config = await InstitucionConfig.obtenerConfiguracion();

        const ahora = new Date();
        const horaActual = ahora.getHours();
        const minsActual = ahora.getMinutes();
        const segsActual = ahora.getSeconds();

        // Convertir a segundos desde el inicio del día para comparación fácil
        const segundosAhora = (horaActual * 3600) + (minsActual * 60) + segsActual;

        const [hInicio, mInicio, sInicio] = config.horario_valido_inicio.split(':').map(Number);
        const segundosInicio = (hInicio * 3600) + (mInicio * 60) + sInicio;

        const [hFin, mFin, sFin] = config.horario_valido_fin.split(':').map(Number);
        const segundosFin = (hFin * 3600) + (mFin * 60) + sFin;

        const permitido = segundosAhora >= segundosInicio && segundosAhora <= segundosFin;

        return {
            permitido,
            inicioLabel: config.horario_valido_inicio.substring(0, 5),
            finLabel: config.horario_valido_fin.substring(0, 5)
        };
    } catch (error) {
        console.error('Error validando horario:', error);
        // En caso de error, permitimos por defecto para no bloquear el sistema 
        // o bloqueamos según política. Aquí permitimos pero informamos.
        return {
            permitido: true,
            inicioLabel: '00:00',
            finLabel: '23:59'
        };
    }
}

module.exports = {
    validarHorarioActual
};
