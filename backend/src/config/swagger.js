const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Restaurante Escolar',
            version: '1.0.0',
            description: 'Documentación oficial de la API para el Sistema de Asistencia del Restaurante Escolar.',
            contact: {
                name: 'Soporte Técnico',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Servidor Local (Desarrollo)',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/routes/*.js', './src/app.js'], // Archivos donde buscaremos anotaciones Swagger
};

const specs = swaggerJsdoc(options);

module.exports = specs;
