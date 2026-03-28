const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.usingEthereal = false;
  }

  /**
   * Inicializar el transportador de email
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const emailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASS || ''
        }
      };

      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Credenciales de email no configuradas. Configura EMAIL_USER y EMAIL_PASS en producción.');
        }

        console.warn('⚠️ No hay credenciales de email configuradas. Usando cuenta de prueba Ethereal...');
        const testAccount = await nodemailer.createTestAccount();
        emailConfig.host = 'smtp.ethereal.email';
        emailConfig.port = 587;
        emailConfig.secure = false;
        emailConfig.auth = {
          user: testAccount.user,
          pass: testAccount.pass
        };
        this.usingEthereal = true;
        console.log('📧 Cuenta de prueba creada:', testAccount.user);
      } else {
        this.usingEthereal = false;
      }

      this.transporter = nodemailer.createTransport(emailConfig);
      await this.transporter.verify();
      this.initialized = true;
      console.log('✅ Servicio de email inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando servicio de email:', error);
      throw error;
    }
  }

  /**
   * Cargar plantilla HTML de email
   */
  async loadTemplate(templateName, variables = {}) {
    try {
      const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
      let html = await fs.readFile(templatePath, 'utf-8');

      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, variables[key]);
      });

      return html;
    } catch (error) {
      console.error(`❌ Error cargando plantilla ${templateName}:`, error);
      throw error;
    }
  }

  /**
   * Enviar email genérico
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const fromName = process.env.EMAIL_FROM || "Restaurante Escolar I.E. San Antonio de Prado";
      const fromEmail = process.env.EMAIL_USER || 'noreply@restaurante.edu.co';

      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        text,
        html,
        attachments
      });

      console.log('✅ Email enviado:', info.messageId);

      if (info.messageId && (process.env.NODE_ENV !== 'production' || this.usingEthereal)) {
        console.log('🔗 Vista previa del email:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: this.usingEthereal ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar notificación de estudiante validado
   */
  async sendEstudianteValidadoEmail(estudiante, acudiente) {
    try {
      const html = await this.loadTemplate('estudiante-validado', {
        nombre_estudiante: `${estudiante.nombre} ${estudiante.apellidos}`,
        matricula: estudiante.matricula || 'N/A',
        grado: estudiante.grado || 'N/A',
        jornada: estudiante.jornada || 'N/A',
        nombre_acudiente: acudiente ? `${acudiente.nombre} ${acudiente.apellidos}` : 'N/A',
        fecha: new Date().toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });

      const emailEstudiante = estudiante.email;
      if (emailEstudiante) {
        await this.sendEmail({
          to: emailEstudiante,
          subject: '✅ Tu inscripción al Restaurante Escolar ha sido APROBADA',
          html
        });
      }

      if (acudiente && acudiente.email) {
        await this.sendEmail({
          to: acudiente.email,
          subject: `✅ Inscripción APROBADA - ${estudiante.nombre} ${estudiante.apellidos}`,
          html
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error enviando email de validación:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar notificación de estudiante rechazado
   */
  async sendEstudianteRechazadoEmail(estudiante, acudiente, motivo) {
    try {
      const html = await this.loadTemplate('estudiante-rechazado', {
        nombre_estudiante: `${estudiante.nombre} ${estudiante.apellidos}`,
        matricula: estudiante.matricula || 'N/A',
        motivo: motivo || 'No se especificó un motivo',
        nombre_acudiente: acudiente ? `${acudiente.nombre} ${acudiente.apellidos}` : 'N/A',
        fecha: new Date().toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });

      const emailEstudiante = estudiante.email;
      if (emailEstudiante) {
        await this.sendEmail({
          to: emailEstudiante,
          subject: '❌ Tu inscripción al Restaurante Escolar ha sido RECHAZADA',
          html
        });
      }

      if (acudiente && acudiente.email) {
        await this.sendEmail({
          to: acudiente.email,
          subject: `❌ Inscripción RECHAZADA - ${estudiante.nombre} ${estudiante.apellidos}`,
          html
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error enviando email de rechazo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar notificación de estudiante eliminado
   */
  async sendEstudianteEliminadoEmail(estudiante, acudiente, motivo) {
    try {
      const html = await this.loadTemplate('estudiante-eliminado', {
        nombre_estudiante: `${estudiante.nombre} ${estudiante.apellidos}`,
        matricula: estudiante.matricula || 'N/A',
        motivo: motivo || 'No se especificó un motivo',
        nombre_acudiente: acudiente ? `${acudiente.nombre} ${acudiente.apellidos}` : 'N/A',
        fecha: new Date().toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });

      const emailEstudiante = estudiante.email;
      if (emailEstudiante) {
        await this.sendEmail({
          to: emailEstudiante,
          subject: '🗑️ Has sido ELIMINADO del Restaurante Escolar',
          html
        });
      }

      if (acudiente && acudiente.email) {
        await this.sendEmail({
          to: acudiente.email,
          subject: `🗑️ ELIMINACIÓN del Restaurante - ${estudiante.nombre} ${estudiante.apellidos}`,
          html
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error enviando email de eliminación:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar notificación de asistencia rechazada
   */
  async sendAsistenciaRechazadaEmail(estudiante, acudiente, fecha, hora, motivo) {
    try {
      const html = await this.loadTemplate('asistencia-rechazada', {
        nombre_estudiante: `${estudiante.nombre} ${estudiante.apellidos}`,
        matricula: estudiante.matricula || 'N/A',
        grado: estudiante.grado || 'N/A',
        fecha: new Date(fecha).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        hora: hora,
        motivo: motivo || 'No se especificó un motivo',
        nombre_acudiente: acudiente ? `${acudiente.nombre} ${acudiente.apellidos}` : 'N/A'
      });

      const emailEstudiante = estudiante.email;
      if (emailEstudiante) {
        await this.sendEmail({
          to: emailEstudiante,
          subject: '🚫 Entrada al Restaurante RECHAZADA',
          html
        });
      }

      if (acudiente && acudiente.email) {
        await this.sendEmail({
          to: acudiente.email,
          subject: `🚫 Entrada RECHAZADA - ${estudiante.nombre} ${estudiante.apellidos}`,
          html
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error enviando email de asistencia rechazada:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar correo de bienvenida al registrarse
   */
  async sendWelcomeEmail({ email, nombre, apellidos, fechaRegistro, enlacePortal }) {
    try {
      const nombreCompleto = `${nombre} ${apellidos}`.trim();
      const html = await this.loadTemplate('bienvenida-estudiante', {
        nombre_completo: nombreCompleto,
        fecha_registro: fechaRegistro || new Date().toLocaleDateString('es-ES'),
        enlace_portal: enlacePortal || 'https://restaurante-escolar.edu.co'
      });

      await this.sendEmail({
        to: email,
        subject: '🎉 ¡Bienvenido al Restaurante Escolar I.E. San Antonio de Prado!',
        html
      });

      return { success: true };
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar código de recuperación de contraseña
   */
  async sendPasswordResetCodeEmail({ email, nombreDestinatario, codigo, vigenciaMinutos, fechaGeneracion }) {
    try {
      const html = await this.loadTemplate('password-reset-code', {
        nombre_destinatario: nombreDestinatario || 'Usuario',
        codigo,
        vigencia_minutos: vigenciaMinutos,
        fecha_generacion: fechaGeneracion || new Date().toLocaleString('es-ES')
      });

      await this.sendEmail({
        to: email,
        subject: '🔐 Código de seguridad para restablecer tu contraseña',
        html
      });

      return { success: true };
    } catch (error) {
      console.error('Error enviando código de seguridad:', error);
      return { success: false, error: error.message };
    }
  }
}

const emailService = new EmailService();
module.exports = emailService;
