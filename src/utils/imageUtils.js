/**
 * Utilidad para construir URLs de imágenes correctamente
 */
import backendDetector from '../services/BackendDetector';

// Obtener la URL base del backend
export const getBackendBaseURL = () => {
  // Intentar obtener la URL del BackendDetector
  const backendURL = backendDetector.getCurrentBaseURL();
  
  if (backendURL) {
    // Remover /api del final si existe
    return backendURL.replace('/api', '');
  }
  
  // Fallback: construir desde la configuración en public/backend-port.json
  // o usar localhost:5000 como último recurso
  const currentHost = window.location.hostname;
  
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // Para conexiones LAN, intentar con el mismo host pero puerto 5000
  return `http://${currentHost}:5000`;
};

/**
 * Construye la URL completa para una imagen de perfil
 * @param {string} filename - Nombre del archivo (ej: "foto_perfil-123456.jpg")
 * @returns {string} URL completa de la imagen
 */
export const getProfilePhotoUrl = (filename) => {
  if (!filename) {
    // No mostrar log para evitar spam en consola
    return null;
  }
  
  const backendURL = getBackendBaseURL();
  const fullUrl = `${backendURL}/uploads/profiles/${filename}`;
  
  // Solo log en desarrollo
  if (import.meta.env.DEV) {
    console.log('📸 [getProfilePhotoUrl] URL:', fullUrl);
  }
  
  return fullUrl;
};

/**
 * Construye la URL completa para cualquier archivo subido
 * @param {string} path - Ruta relativa del archivo (ej: "profiles/foto.jpg")
 * @returns {string} URL completa del archivo
 */
export const getUploadUrl = (path) => {
  if (!path) return null;
  
  const backendURL = getBackendBaseURL();
  // Remover "/" inicial si existe
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${backendURL}/uploads/${cleanPath}`;
};

export default {
  getBackendBaseURL,
  getProfilePhotoUrl,
  getUploadUrl
};
