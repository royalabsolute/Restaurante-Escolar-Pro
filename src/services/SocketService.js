import { io } from 'socket.io-client';
import ApiService from './ApiService';

let socket;

const SocketService = {
  connect: async () => {
    if (socket?.connected) return socket;

    try {
      // Intentar obtener la URL del backend desde el archivo de configuración generado por el servidor
      const response = await fetch('/backend-port.json');
      const config = await response.json();
      const serverUrl = config.lan_url || window.location.origin;

      socket = io(serverUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true
      });

      socket.on('connect', () => {
        console.log('✅ Conectado al servidor de Sockets');
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión Socket:', error);
      });

      return socket;
    } catch (error) {
      console.error('No se pudo establecer conexión Socket:', error);
      // Fallback a la misma URL si falla el fetch
      socket = io(window.location.origin);
      return socket;
    }
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
    }
  },

  onAttendanceUpdate: (callback) => {
    if (socket) {
      socket.on('attendanceUpdate', callback);
    }
  },

  removeAttendanceUpdate: (callback) => {
    if (socket) {
      socket.off('attendanceUpdate', callback);
    }
  }
};

export default SocketService;
