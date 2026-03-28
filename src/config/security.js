/**
 * CONFIGURACIÓN DE SEGURIDAD DEL SISTEMA
 * 
 * ⚠️ ADVERTENCIA CRÍTICA:
 * - Esta contraseña es ÚNICA e INMUTABLE
 * - NO modificar bajo ninguna circunstancia
 * - Mantener este archivo en .gitignore para seguridad
 * - Solo el administrador principal debe conocer esta clave
 * 
 * Contraseña generada: 7K9mX4pL2w
 * Fecha de creación: 11 de octubre de 2025
 */

// Contraseña maestra para operaciones críticas del administrador
export const ADMIN_MASTER_PASSWORD = '7K9mX4pL2w';

/**
 * Verifica si la contraseña proporcionada coincide con la contraseña maestra
 * @param {string} password - Contraseña a verificar
 * @returns {boolean} - true si la contraseña es correcta
 */
export const verifyMasterPassword = (password) => {
  return password === ADMIN_MASTER_PASSWORD;
};

/**
 * Operaciones que requieren contraseña maestra
 */
export const CRITICAL_OPERATIONS = {
  REGENERATE_ALL_QR: 'regenerar_todos_qr',
  DELETE_ALL_DATA: 'eliminar_todos_datos',
  MODIFY_SYSTEM_CONFIG: 'modificar_configuracion_sistema',
  RESET_DATABASE: 'resetear_base_datos'
};

export default {
  ADMIN_MASTER_PASSWORD,
  verifyMasterPassword,
  CRITICAL_OPERATIONS
};
