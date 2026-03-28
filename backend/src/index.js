const app = require('./app');
const path = require('path');
const fs = require('fs');
const os = require('os');
const database = require('./config/database');
const logger = require('./utils/logger');

// Capturar errores no manejados para que el proceso no muera silenciosamente (BUG-WBOX-001)
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason: reason.message || reason });
    // En producción podrías querer un reinicio controlado si es crítico
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
    // Es recomendable salir y dejar que el orquestador (pm2/systemd) reinicie
    process.exit(1);
});

const PORT = process.env.PORT || 5000;

// Función para iniciar el servidor con reintentos de puerto
const startServer = async (retryCount = 0) => {
    try {
        // 🔐 VALIDACIÓN DE SEGURIDAD CRÍTICA (BUG-007)
        const isProduction = process.env.NODE_ENV === 'production';
        const jwtSecret = process.env.JWT_SECRET;

        if (isProduction) {
            if (!jwtSecret || jwtSecret === 'tu-clave-secreta-muy-segura') {
                logger.error('ERROR CRÍTICO DE SEGURIDAD: JWT_SECRET no configurado o es el valor por defecto en PRODUCCIÓN.');
                logger.error('🛑 El servidor no se iniciará hasta que se configure una clave secreta segura.');
                process.exit(1);
            }
        } else if (!jwtSecret) {
            if (retryCount === 0) {
                logger.warn('JWT_SECRET no configurado. Usando clave por defecto para desarrollo.');
            }
        }

        const currentPort = (parseInt(PORT) || 5000) + retryCount;

        if (retryCount > 10) {
            console.error('❌ No hay puertos disponibles después de 10 intentos.');
            process.exit(1);
        }

        const server = app.listen(currentPort, '0.0.0.0', async () => {
            // Inicializar Socket.io con el servidor HTTP
            const socketService = require('./services/socketService');
            socketService.init(server);

            const isDev = process.env.NODE_ENV !== 'production';
            const networkInterfaces = os.networkInterfaces();
            let localIP = '127.0.0.1';

            for (const interfaceName in networkInterfaces) {
                for (const net of networkInterfaces[interfaceName]) {
                    if (net.family === 'IPv4' && !net.internal) {
                        if (net.address.startsWith('192.168.') || net.address.startsWith('10.') || net.address.startsWith('172.')) {
                            localIP = net.address;
                            break;
                        }
                    }
                }
                if (localIP !== '127.0.0.1') break;
            }

            // Banner Estilizado
            console.log('\n' + '='.repeat(60));
            logger.info(`🚀 SISTEMA DE RESTAURANTE ESCOLAR - BACKEND`, { startup: true });
            console.log('='.repeat(60));
            logger.info(`Entorno: ${isDev ? '\x1b[33mDESARROLLO\x1b[0m' : '\x1b[32mPRODUCCIÓN\x1b[0m'}`);
            logger.info(`Puerto:  ${currentPort}`);
            logger.info(`Base de Datos: ${process.env.DB_NAME || 'restaurante_escolar_db'}`);
            console.log('-'.repeat(60));
            logger.info(`Acceso Local: http://localhost:${currentPort}`);
            logger.info(`Acceso LAN:   http://${localIP}:${currentPort}`);
            console.log('='.repeat(60) + '\n');

            // Guardar info del puerto
            const portInfo = {
                backend_port: currentPort,
                server_ip: localIP,
                local_url: `http://localhost:${currentPort}`,
                lan_url: `http://${localIP}:${currentPort}`,
                status: 'running',
                timestamp: new Date().toISOString()
            };

            try {
                // Escribir en backend/backend-port.json (para scripts)
                fs.writeFileSync(path.join(__dirname, '../backend-port.json'), JSON.stringify(portInfo, null, 2));
                
                // Escribir en public/backend-port.json (para desarrollo)
                const publicPath = path.join(__dirname, '../../public/backend-port.json');
                const publicDir = path.dirname(publicPath);
                if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
                fs.writeFileSync(publicPath, JSON.stringify(portInfo, null, 2));

                // Escribir en dist/backend-port.json (para producción/frontend servido)
                const distPath = path.join(__dirname, '../../dist/backend-port.json');
                const distDir = path.dirname(distPath);
                if (fs.existsSync(distDir)) {
                    fs.writeFileSync(distPath, JSON.stringify(portInfo, null, 2));
                    logger.info('📡 Configuración de red sincronizada con el frontend (dist)');
                }
            } catch (err) {
                logger.warn(`No se pudo guardar backend-port.json: ${err.message}`);
            }

            const dbConnected = await database.testConnection();
            if (dbConnected) {
                logger.info('✅ Sistema completamente operativo');
            } else {
                logger.error('❌ El sistema inició con errores en la base de datos');
            }
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.warn(`Puerto ${currentPort} ocupado, intentando con el siguiente...`);
                server.close();
                startServer(retryCount + 1);
            } else {
                logger.error('Error fatal iniciando servidor:', error);
                process.exit(1);
            }
        });

        process.on('SIGTERM', () => server.close(() => {
            logger.info('Servidor cerrado (SIGTERM)');
            process.exit(0);
        }));

        process.on('SIGINT', () => server.close(() => {
            logger.info('Servidor cerrado (SIGINT)');
            process.exit(0);
        }));

    } catch (error) {
        logger.error('❌ Error iniciando servidor:', error.message);
        process.exit(1);
    }
};

startServer();
