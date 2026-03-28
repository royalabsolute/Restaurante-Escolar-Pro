const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const database = require('./config/database');

// Importar middleware personalizado
const { standardResponse, globalErrorHandler, notFoundHandler } = require('./middleware/standardResponse');
const requestId = require('./middleware/requestId');
const logger = require('./utils/logger');

// Importar rutas
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const secretaryRoutes = require('./routes/secretary');
const adminRoutes = require('./routes/admin');
const justificacionesRoutes = require('./routes/justificaciones');
const reportesRoutes = require('./routes/reportes');
const estudiantesRoutes = require('./routes/estudiantes');
const qrRoutes = require('./routes/qr');
const testQrRoutes = require('./routes/test-qr');
const configuracionRoutes = require('./routes/configuracion');
const prioritiesRoutes = require('./routes/priorities');
const groupsRoutes = require('./routes/groups');
const publicRoutes = require('./routes/public');
const respaldosRoutes = require('./routes/respaldos');
const suplenteQRRoutes = require('./routes/suplente-qr');
const docenteRoutes = require('./routes/docente');
const alfabetizadorRoutes = require('./routes/alfabetizador');

// Importar configuración de Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const app = express();

// Middleware de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1000 : 5000, // Aumentado para evitar bloqueos en NAT escolares
  message: {
    status: 'ERROR',
    message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health' || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
});

if (process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMIT === 'true') {
  app.use('/api', limiter);
}

// CORS
const corsOptions = {
  origin: function (origin, callback) {
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    if (!origin) return callback(null, true);
    callback(null, true); // En producción se recomienda restringir
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(requestId);
app.use(standardResponse);

// Logging (solo si no es entorno de pruebas)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.api.response(req, res, duration);
    });
    next();
  });
}

// Archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/assets', express.static(path.join(__dirname, '../../src/assets')));

// Frontend compilado
const distPath = path.join(__dirname, '../../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/justificaciones', justificacionesRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/secretary', secretaryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/test-qr', testQrRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/priorities', prioritiesRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/respaldos', respaldosRoutes);
app.use('/api/suplente-qr', suplenteQRRoutes);
app.use('/api/docente', docenteRoutes);
app.use('/api/alfabetizador', alfabetizadorRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Catch-all para React Router
// Redirige todas las rutas no API ni archivos estáticos al frontend compilado
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/assets')) {
    return next();
  }
  const indexPath = path.join(__dirname, '../../dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

app.use('*', notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;