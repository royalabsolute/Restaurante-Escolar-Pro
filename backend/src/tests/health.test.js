const request = require('supertest');
const app = require('../app');

describe('Health Check API', () => {
    it('debería retornar 200 OK y el mensaje correcto', async () => {
        const response = await request(app).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'OK');
        expect(response.body).toHaveProperty('message', 'Servidor funcionando correctamente');
    });

    it('debería retornar 404 para rutas inexistentes de la API', async () => {
        const response = await request(app).get('/api/ruta-que-no-existe');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('status', 'ERROR');
        expect(response.body).toHaveProperty('message', 'Endpoint no encontrado');
    });
});
