// Configuración global para tests
const database = require('../config/database');

// Mockear la base de datos para evitar conexiones reales durante tests unitarios
// Si necesitamos tests de integración reales, usaremos una DB de testing
jest.mock('../config/database', () => ({
    query: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true),
    getConnection: jest.fn().mockResolvedValue({
        release: jest.fn(),
        query: jest.fn(),
        execute: jest.fn()
    })
}));

// Aumentar el timeout para tests largos
jest.setTimeout(30000);
