const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const database = require('../config/database');
const emailService = require('../utils/emailService');
const bcrypt = require('bcrypt');

class RespaldoController {
  /**
   * Obtener lista de respaldos disponibles
   */
  static async listarRespaldos(req, res) {
    try {
      const backupDir = path.join(__dirname, '../../backups');

      // Crear directorio si no existe
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        return res.json({
          success: true,
          data: []
        });
      }

      // Leer archivos y carpetas de respaldo
      const items = fs.readdirSync(backupDir);
      const files = [];

      for (const item of items) {
        const filePath = path.join(backupDir, item);
        const stats = fs.statSync(filePath);

        // Filtrar: archivos .sql O carpetas que empiecen con backup_csv_
        if (item.endsWith('.sql') || (stats.isDirectory() && item.startsWith('backup_csv_'))) {
          let tamanoTotal = stats.size;
          let formato = 'SQL';

          // Si es carpeta CSV, calcular tamaño total
          if (stats.isDirectory()) {
            formato = 'CSV';
            const csvFiles = fs.readdirSync(filePath);
            tamanoTotal = csvFiles.reduce((total, csvFile) => {
              const csvStats = fs.statSync(path.join(filePath, csvFile));
              return total + csvStats.size;
            }, 0);
          } else {
            formato = 'SQL';
          }

          // Determinar tipo de respaldo
          let tipo = 'Completo';
          if (item.includes('incremental')) {
            tipo = 'Incremental';
          }

          files.push({
            nombre: item,
            fecha: stats.mtime.toISOString(),
            tamano: (tamanoTotal / (1024 * 1024)).toFixed(2) + ' MB',
            tamanoBruto: tamanoTotal,
            tipo: tipo,
            formato: formato,
            estado: 'completado',
            descripcion: `Respaldo ${tipo.toLowerCase()} del sistema`
          });
        }
      }

      files.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      res.json({
        success: true,
        data: files
      });

    } catch (error) {
      console.error('Error listando respaldos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al listar respaldos',
        error: error.message
      });
    }
  }

  /**
   * Crear nuevo respaldo SQL
   */
  static async crearRespaldoSQL(req, res) {
    try {
      const { tipo = 'completo' } = req.body;

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const backupDir = path.join(__dirname, '../../backups');

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const tipoLabel = tipo === 'incremental' ? 'incremental' : 'completo';
      const backupFile = path.join(backupDir, `backup_${tipoLabel}_${timestamp}_${Date.now()}.sql`);

      // Configuración de la base de datos
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '3306',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'restaurante_escolar_db'
      };

      // Determinar ruta de mysqldump (XAMPP o sistema)
      const mysqldumpPath = fs.existsSync('C:\\xampp\\mysql\\bin\\mysqldump.exe')
        ? 'C:\\xampp\\mysql\\bin\\mysqldump.exe'
        : 'mysqldump';

      // Preparar comando mysqldump - SIN --result-file, usaremos redirección
      const args = [
        '--host=' + dbConfig.host,
        '--port=' + dbConfig.port,
        '--user=' + dbConfig.user,
      ];

      if (dbConfig.password) {
        args.push('--password=' + dbConfig.password);
      }

      args.push(
        '--routines',
        '--triggers',
        '--single-transaction',
        '--no-tablespaces',
        '--add-drop-table',
        '--complete-insert',
        '--extended-insert',
        '--databases',
        dbConfig.database
      );

      console.log('Ejecutando mysqldump:', mysqldumpPath);
      console.log('Argumentos:', args.filter(a => !a.includes('password')));
      console.log('Archivo destino:', backupFile);

      // Ejecutar mysqldump con redirección de stdout
      const mysqldump = spawn(mysqldumpPath, args, {
        shell: false
      });

      // Crear stream de escritura
      const writeStream = fs.createWriteStream(backupFile, { encoding: 'utf8' });

      let errorOutput = '';

      // Pipe stdout directamente al archivo
      mysqldump.stdout.pipe(writeStream);

      mysqldump.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('mysqldump stderr:', data.toString());
      });

      mysqldump.on('close', (code) => {
        console.log('mysqldump cerrado con código:', code);
        console.log('stderr:', errorOutput);

        if (code === 0 && fs.existsSync(backupFile)) {
          const stats = fs.statSync(backupFile);

          // Verificar que el archivo no sea HTML
          const content = fs.readFileSync(backupFile, 'utf8').substring(0, 100);
          if (content.includes('<!doctype') || content.includes('<html')) {
            fs.unlinkSync(backupFile);
            return res.status(500).json({
              success: false,
              message: 'Error: Se generó HTML en lugar de SQL',
              error: 'Verifica la configuración de la base de datos'
            });
          }

          // Registrar en log
          const logFile = path.join(backupDir, 'backup_log.txt');
          const logEntry = `${new Date().toISOString()} - Respaldo SQL exitoso: ${path.basename(backupFile)} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)\n`;
          fs.appendFileSync(logFile, logEntry);

          res.json({
            success: true,
            message: 'Respaldo SQL creado exitosamente',
            data: {
              nombre: path.basename(backupFile),
              fecha: new Date().toISOString(),
              tamano: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
              tipo: tipoLabel,
              formato: 'SQL'
            }
          });
        } else {
          if (fs.existsSync(backupFile)) {
            fs.unlinkSync(backupFile);
          }
          res.status(500).json({
            success: false,
            message: 'Error al crear respaldo SQL',
            error: errorOutput || 'mysqldump falló con código ' + code
          });
        }
      });

      mysqldump.on('error', (error) => {
        console.error('Error spawn mysqldump:', error);
        res.status(500).json({
          success: false,
          message: 'Error ejecutando mysqldump',
          error: error.message,
          hint: 'Verifica que mysqldump esté en: ' + mysqldumpPath
        });
      });

    } catch (error) {
      console.error('Error creando respaldo SQL:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear respaldo SQL',
        error: error.message
      });
    }
  }

  /**
   * Crear respaldo en formato CSV
   */
  static async crearRespaldoCSV(req, res) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const backupDir = path.join(__dirname, '../../backups');

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const csvDir = path.join(backupDir, `backup_csv_${timestamp}_${Date.now()}`);
      fs.mkdirSync(csvDir, { recursive: true });

      // Tablas a exportar
      const tablasExportar = [
        'usuarios',
        'estudiantes',
        'acudientes',
        'alfabetizadores',
        'asistencias',
        'justificaciones',
        'configuracion_institucional'
      ];

      const archivosCreados = [];

      for (const tabla of tablasExportar) {
        try {
          const query = `SELECT * FROM ${tabla}`;
          const rows = await database.query(query);

          if (rows && rows.length > 0) {
            // Crear CSV
            const headers = Object.keys(rows[0]).join(',');
            const csvContent = [headers];

            rows.forEach(row => {
              const values = Object.values(row).map(val => {
                if (val === null) return '';
                if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
                return val;
              });
              csvContent.push(values.join(','));
            });

            const csvFile = path.join(csvDir, `${tabla}.csv`);
            fs.writeFileSync(csvFile, csvContent.join('\n'), 'utf8');
            archivosCreados.push(`${tabla}.csv`);
          }
        } catch (error) {
          console.warn(`Error exportando tabla ${tabla}:`, error.message);
        }
      }

      // Calcular tamaño total
      let totalSize = 0;
      fs.readdirSync(csvDir).forEach(file => {
        const stats = fs.statSync(path.join(csvDir, file));
        totalSize += stats.size;
      });

      // Registrar en log
      const logFile = path.join(backupDir, 'backup_log.txt');
      const logEntry = `${new Date().toISOString()} - Respaldo CSV exitoso: ${path.basename(csvDir)} (${archivosCreados.length} archivos, ${(totalSize / (1024 * 1024)).toFixed(2)} MB)\n`;
      fs.appendFileSync(logFile, logEntry);

      res.json({
        success: true,
        message: 'Respaldo CSV creado exitosamente',
        data: {
          nombre: path.basename(csvDir),
          fecha: new Date().toISOString(),
          tamano: (totalSize / (1024 * 1024)).toFixed(2) + ' MB',
          tipo: 'Completo',
          formato: 'CSV',
          archivos: archivosCreados
        }
      });

    } catch (error) {
      console.error('Error creando respaldo CSV:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear respaldo CSV',
        error: error.message
      });
    }
  }

  /**
   * Descargar archivo de respaldo
   */
  static async descargarRespaldo(req, res) {
    try {
      const { nombre } = req.params;
      const backupDir = path.join(__dirname, '../../backups');
      const filePath = path.join(backupDir, nombre);

      // Verificar que el archivo existe y está dentro del directorio de respaldos
      if (!fs.existsSync(filePath) || !filePath.startsWith(backupDir)) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado'
        });
      }

      const stats = fs.statSync(filePath);

      // Si es un directorio CSV, crear un archivo ZIP temporal
      if (stats.isDirectory()) {
        const archiver = require('archiver');
        const zipName = `${nombre}.zip`;

        res.attachment(zipName);
        res.setHeader('Content-Type', 'application/zip');

        const archive = archiver('zip', {
          zlib: { level: 9 } // Máxima compresión
        });

        archive.on('error', (err) => {
          console.error('Error creando ZIP:', err);
          res.status(500).json({
            success: false,
            message: 'Error al comprimir archivos'
          });
        });

        // Pipe del archivo ZIP a la respuesta
        archive.pipe(res);

        // Agregar todos los archivos CSV del directorio
        archive.directory(filePath, false);

        // Finalizar el archivo
        await archive.finalize();

        return;
      }

      // Descargar archivo SQL directamente
      res.download(filePath, nombre, (err) => {
        if (err && !res.headersSent) {
          console.error('Error descargando archivo:', err);
          res.status(500).json({
            success: false,
            message: 'Error al descargar archivo'
          });
        }
      });

    } catch (error) {
      console.error('Error descargando respaldo:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error al descargar respaldo',
          error: error.message
        });
      }
    }
  }

  /**
   * Eliminar respaldo
   */
  static async eliminarRespaldo(req, res) {
    try {
      const { nombre } = req.params;
      const backupDir = path.join(__dirname, '../../backups');
      const filePath = path.join(backupDir, nombre);

      // Verificar que el archivo existe y está dentro del directorio de respaldos
      if (!fs.existsSync(filePath) || !filePath.startsWith(backupDir)) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado'
        });
      }

      // Eliminar archivo o directorio
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }

      // Registrar en log
      const logFile = path.join(backupDir, 'backup_log.txt');
      const logEntry = `${new Date().toISOString()} - Respaldo eliminado: ${nombre}\n`;
      fs.appendFileSync(logFile, logEntry);

      res.json({
        success: true,
        message: 'Respaldo eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando respaldo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar respaldo',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de respaldos
   */
  static async obtenerEstadisticas(req, res) {
    try {
      const backupDir = path.join(__dirname, '../../backups');

      if (!fs.existsSync(backupDir)) {
        return res.json({
          success: true,
          data: {
            totalRespaldos: 0,
            tamanоTotal: '0 MB',
            ultimoRespaldo: null,
            espacioDisponible: 'N/A'
          }
        });
      }

      const files = fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.sql') || (fs.statSync(path.join(backupDir, file)).isDirectory() && file.startsWith('backup_csv_')));

      let totalSize = 0;
      let ultimaFecha = null;

      files.forEach(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          // Sumar tamaño de archivos CSV
          fs.readdirSync(filePath).forEach(csvFile => {
            const csvStats = fs.statSync(path.join(filePath, csvFile));
            totalSize += csvStats.size;
          });
        } else {
          totalSize += stats.size;
        }

        if (!ultimaFecha || stats.mtime > ultimaFecha) {
          ultimaFecha = stats.mtime;
        }
      });

      res.json({
        success: true,
        data: {
          totalRespaldos: files.length,
          tamanоTotal: (totalSize / (1024 * 1024)).toFixed(2) + ' MB',
          ultimoRespaldo: ultimaFecha ? ultimaFecha.toISOString() : null,
          espacioDisponible: 'N/A'
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }

  static async restaurarRespaldo(req, res) {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Debe adjuntar un archivo SQL para restaurar la base de datos'
      });
    }

    const extension = path.extname(file.originalname || '').toLowerCase();
    if (extension !== '.sql') {
      fs.unlink(file.path, () => { });
      return res.status(400).json({
        success: false,
        message: 'Formato no soportado. Solo se permiten archivos .sql'
      });
    }

    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '3306',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'restaurante_escolar_db'
    };

    const mysqlPath = fs.existsSync('C:\\xampp\\mysql\\bin\\mysql.exe')
      ? 'C:\\xampp\\mysql\\bin\\mysql.exe'
      : 'mysql';

    const args = [
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--user=${dbConfig.user}`,
      dbConfig.database
    ];

    if (dbConfig.password) {
      args.splice(3, 0, `--password=${dbConfig.password}`);
    }

    let stderrOutput = '';
    let responded = false;

    try {
      const mysqlProcess = spawn(mysqlPath, args, { stdio: ['pipe', 'pipe', 'pipe'] });

      mysqlProcess.stderr.on('data', (data) => {
        stderrOutput += data.toString();
      });

      mysqlProcess.on('error', (error) => {
        if (!responded) {
          responded = true;
          fs.unlink(file.path, () => { });
          res.status(500).json({
            success: false,
            message: 'No se pudo ejecutar el proceso de restauración',
            error: error.message
          });
        }
      });

      mysqlProcess.on('close', async (code) => {
        fs.unlink(file.path, () => { });

        if (responded) {
          return;
        }

        responded = true;

        if (code === 0) {
          try {
            const html = await emailService.loadTemplate('notificacion-sistema', {
              titulo: 'Restauración de Base de Datos',
              mensaje: 'Se ha completado exitosamente la restauración de la base de datos.',
              detalle: `<p>Archivo origen: <strong>${file.originalname}</strong></p><p>Estado: Exitosa</p>`,
              fecha: new Date().toLocaleString('es-CO')
            });

            await emailService.sendEmail({
              to: 'restaurante@iesanantoniodeprado.edu.co',
              subject: 'Restauración de base de datos completada',
              html
            });
          } catch (emailError) {
            console.warn('No se pudo enviar email de restauración:', emailError.message);
          }

          res.json({
            success: true,
            message: 'Base de datos restaurada exitosamente'
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Error al restaurar la base de datos',
            error: stderrOutput || `Proceso finalizó con código ${code}`
          });
        }
      });

      const readStream = fs.createReadStream(file.path);
      readStream.on('error', (error) => {
        mysqlProcess.kill('SIGTERM');
        if (!responded) {
          responded = true;
          fs.unlink(file.path, () => { });
          res.status(500).json({
            success: false,
            message: 'No se pudo leer el archivo de respaldo',
            error: error.message
          });
        }
      });

      readStream.pipe(mysqlProcess.stdin);
      readStream.on('end', () => {
        mysqlProcess.stdin.end();
      });
    } catch (error) {
      fs.unlink(file.path, () => { });
      res.status(500).json({
        success: false,
        message: 'Error inesperado durante la restauración',
        error: error.message
      });
    }
  }

  static async vaciarBaseDatos(req, res) {
    const { password } = req.body;
    const adminId = req.user?.id;
    let foreignKeysDisabled = false;
    const resumen = [];

    try {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere la contraseña de administrador para esta acción'
        });
      }

      // Verificar contraseña
      const user = await database.query('SELECT password FROM usuarios WHERE id = ?', [adminId]);
      if (!user || user.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const isValid = await bcrypt.compare(password, user[0].password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña de administrador incorrecta'
        });
      }

      await database.query('SET FOREIGN_KEY_CHECKS = 0');
      foreignKeysDisabled = true;

      const tablas = await database.query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
      if (!tablas || tablas.length === 0) {
        await database.query('SET FOREIGN_KEY_CHECKS = 1');
        return res.json({
          success: true,
          message: 'No se encontraron tablas para vaciar',
          data: {
            tablasAfectadas: 0,
            registrosEliminados: 0,
            detalle: []
          }
        });
      }

      const tableKey = Object.keys(tablas[0])[0];
      const ignoreTables = new Set(['migrations', 'migrations_lock']);

      for (const row of tablas) {
        const tableName = row[tableKey];
        if (!tableName || ignoreTables.has(tableName)) {
          continue;
        }

        try {
          const countResult = await database.query(`SELECT COUNT(*) AS total FROM \`${tableName}\``);
          const total = countResult?.[0]?.total || 0;
          await database.query(`TRUNCATE TABLE \`${tableName}\``);
          resumen.push({ tabla: tableName, registrosEliminados: total });
        } catch (tableError) {
          console.warn(`No se pudo truncar la tabla ${tableName}:`, tableError.message);
        }
      }

      const totalRegistros = resumen.reduce((acc, item) => acc + item.registrosEliminados, 0);

      try {
        const detalleHtml = resumen.slice(0, 20).map((item) => `
          <li>${item.tabla}: <strong>${item.registrosEliminados}</strong> registros</li>
        `).join('');

        const html = await emailService.loadTemplate('notificacion-sistema', {
          titulo: 'Base de Datos Vaciada',
          mensaje: 'Se ha completado exitosamente el vaciado de las tablas de la base de datos.',
          detalle: `
            <p><strong>Tablas afectadas:</strong> ${resumen.length}</p>
            <p><strong>Total registros eliminados:</strong> ${totalRegistros}</p>
            ${detalleHtml ? `<ul>${detalleHtml}</ul>` : '<p>No se registraron detalles.</p>'}
          `,
          fecha: new Date().toLocaleString('es-CO')
        });

        await emailService.sendEmail({
          to: 'restaurante@iesanantoniodeprado.edu.co',
          subject: 'Base de datos vaciada correctamente',
          html
        });
      } catch (emailError) {
        console.warn('No se pudo enviar email de vaciado:', emailError.message);
      }

      res.json({
        success: true,
        message: 'Base de datos vaciada exitosamente',
        data: {
          tablasAfectadas: resumen.length,
          registrosEliminados: totalRegistros,
          detalle: resumen
        }
      });
    } catch (error) {
      console.error('Error vaciando base de datos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al vaciar la base de datos',
        error: error.message
      });
    } finally {
      if (foreignKeysDisabled) {
        try {
          await database.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (fkError) {
          console.warn('No se pudo reactivar FOREIGN_KEY_CHECKS:', fkError.message);
        }
      }
    }
  }
}

module.exports = RespaldoController;
