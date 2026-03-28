const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const emailService = require('../src/utils/emailService');

async function testTemplates() {
    console.log('🔍 Verificando existencia de plantillas de email...');
    const templatesDir = path.join(__dirname, '..', 'src', 'templates', 'emails');

    if (!fs.existsSync(templatesDir)) {
        console.error('❌ Error: El directorio de plantillas no existe:', templatesDir);
        return;
    }

    const templates = fs.readdirSync(templatesDir).filter(f => f.endsWith('.html'));
    console.log(`📋 Se encontraron ${templates.length} plantillas.`);

    const dummyVariables = {
        nombre_estudiante: 'Juan Pérez',
        matricula: '12345',
        grado: '10-1',
        jornada: 'Mañana',
        nombre_acudiente: 'María Pérez',
        fecha: 'Lunes 1 de Enero',
        motivo: 'Motivo de prueba',
        hora: '12:00 PM',
        email: 'test@example.com',
        nombre: 'Juan',
        apellidos: 'Pérez',
        fecha_registro: '2024-01-01',
        enlace_portal: 'http://localhost:3000',
        nombre_destinatario: 'Usuario Prueba',
        codigo: '123456',
        vigencia_minutos: '15',
        fecha_generacion: '2024-01-01 10:00 AM',
        nombre_completo: 'Juan Pérez',
        fecha_suspension: '2024-01-01',
        faltas_consecutivas: '4',
        limite_faltas: '4',
        nombre_usuario: 'Administrador',
        periodo_inicio: '2024-01-01',
        periodo_fin: '2024-01-31',
        total_estudiantes: '100',
        total_asistencias: '80',
        total_faltas: '20',
        promedio_asistencia: '80'
    };

    for (const templateFile of templates) {
        const templateName = templateFile.replace('.html', '');
        try {
            const html = await emailService.loadTemplate(templateName, dummyVariables);
            console.log(`✅ Plantilla "${templateName}" cargada y parseada correctamente.`);

            // Verificar si quedan variables sin reemplazar {{variable}}
            if (html.includes('{{')) {
                const missingVars = html.match(/{{[^{}]+}}/g);
                console.warn(`⚠️ Aviso: La plantilla "${templateName}" tiene variables sin reemplazar:`, [...new Set(missingVars)]);
            }
        } catch (error) {
            console.error(`❌ Error cargando plantilla "${templateName}":`, error.message);
        }
    }
}

testTemplates();
