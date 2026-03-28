const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    
    // Determinar carpeta según el tipo de archivo
    if (file.fieldname === 'foto_perfil') {
      uploadPath += 'profiles/';
    } else if (file.fieldname === 'archivo_adjunto') {
      uploadPath += 'documents/';
    } else {
      uploadPath += 'others/';
    }

    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generar nombre único
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'foto_perfil') {
    // Solo imágenes para fotos de perfil
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen para la foto de perfil'), false);
    }
  } else if (file.fieldname === 'archivo_adjunto') {
    // Documentos para justificaciones
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido para justificaciones'), false);
    }
  } else {
    cb(new Error('Campo de archivo no reconocido'), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB por defecto
    files: 1 // Máximo 1 archivo por request
  }
});

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'ERROR',
        message: 'El archivo es demasiado grande. Máximo 5MB permitido.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Demasiados archivos. Solo se permite 1 archivo.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Campo de archivo inesperado.'
      });
    }
  }
  
  if (err) {
    return res.status(400).json({
      status: 'ERROR',
      message: err.message
    });
  }
  
  next();
};

// Middleware específicos para diferentes tipos de archivos
const uploadProfilePhoto = upload.single('foto_perfil');
const uploadJustificationFile = upload.single('archivo_adjunto');

module.exports = {
  upload,
  uploadProfilePhoto,
  uploadJustificationFile,
  handleMulterError
};
