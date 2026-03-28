/**
 * Módulo para mapear los valores de la jornada entre base de datos y frontend
 */

const JORNADA_MAP = {
    // DB -> Frontend
    'mañana': 'Mañana',
    'tarde': 'Tarde',
    'unica': 'Jornada Única',
    'jornada_unica': 'Jornada Única',
    'completa': 'Jornada Única',
    'nocturna': 'Nocturna',
    'sabado': 'Sábado',
};

const REVERSE_MAP = {
    // Frontend -> DB
    'Mañana': 'mañana',
    'Tarde': 'tarde',
    'Jornada Única': 'unica',
    'Nocturna': 'nocturna',
    'Sábado': 'sabado',
};

/**
 * Mapea un valor de jornada de la base de datos al formato del frontend
 * @param {string} value 
 * @returns {string}
 */
const mapToFrontend = (value) => {
    if (!value) return '';
    const normalized = value.toLowerCase().trim();
    return JORNADA_MAP[normalized] || value;
};

/**
 * Mapea un valor de jornada del frontend al formato de la base de datos
 * @param {string} value 
 * @returns {string}
 */
const mapToDatabase = (value) => {
    if (!value) return 'mañana'; // Valor por defecto
    return REVERSE_MAP[value] || value.toLowerCase().trim();
};

/**
 * Mapea la jornada en un array de objetos
 * @param {Array} array 
 * @returns {Array}
 */
const mapArrayToFrontend = (array) => {
    if (!Array.isArray(array)) return array;
    return array.map(item => {
        if (item && item.jornada) {
            return {
                ...item,
                jornada: mapToFrontend(item.jornada)
            };
        }
        return item;
    });
};

module.exports = {
    mapToFrontend,
    mapToDatabase,
    mapArrayToFrontend
};
