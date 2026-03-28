const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const emailService = require('../src/utils/emailService');

async function testConnection() {
    console.log('🔍 Iniciando prueba de conexión SMTP...');
    console.log('📧 Host:', process.env.EMAIL_HOST);
    console.log('📧 Port:', process.env.EMAIL_PORT);
    console.log('📧 User:', process.env.EMAIL_USER);

    try {
        await emailService.initialize();
        console.log('✅ Conexión exitosa verificada con transporter.verify()');

        if (emailService.usingEthereal) {
            console.log('⚠️ Aviso: Usando Ethereal (cuenta de prueba). El email NO llegará a una bandeja real.');
        } else {
            console.log('📧 Usando servidor SMTP real configurado en .env');
        }

        const testEmail = {
            to: process.env.EMAIL_USER,
            subject: '🧪 Prueba de Diagnóstico - Sistema Restaurante Escolar',
            html: '<h1>Prueba de Conexión</h1><p>Si recibes este correo, el servicio de email está correctamente configurado.</p>'
        };

        console.log('📤 Enviando email de prueba a:', testEmail.to);
        const result = await emailService.sendEmail(testEmail);

        if (result.success) {
            console.log('✅ Email enviado exitosamente!');
            console.log('🆔 MessageId:', result.messageId);
            if (result.previewUrl) {
                console.log('🔗 URL de previsualización:', result.previewUrl);
            }
        } else {
            console.log('❌ Falló el envío del email:', result.error);
        }
    } catch (error) {
        console.error('❌ Error crítico en el diagnóstico:', error);
    } finally {
        // En nodemailer v6+ no siempre es necesario cerrar el transporter si es un pool, 
        // pero para scripts únicos es buena práctica.
        if (emailService.transporter) {
            emailService.transporter.close();
        }
    }
}

testConnection();
