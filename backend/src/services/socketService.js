const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io;

const socketService = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: '*', // En producción restringir a CORS_ORIGINS
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      logger.info(`Nueva conexión socket: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Socket desconectado: ${socket.id}`);
      });
    });

    logger.info('✅ Socket.io inicializado correctamente');
    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error('Socket.io no ha sido inicializado');
    }
    return io;
  },

  emitAttendanceUpdate: (data) => {
    if (io) {
      io.emit('attendanceUpdate', data);
      logger.info('📡 Evento attendanceUpdate emitido');
    }
  }
};

module.exports = socketService;
