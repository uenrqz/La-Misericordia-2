const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que el directorio de uploads existe
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar el almacenamiento para multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generar un nombre de archivo único usando timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `resident-${uniqueSuffix}${ext}`);
  }
});

// Filtro para asegurar que solo se cargan imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
  }
};

// Configurar el middleware de multer
const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limitar a 5MB
  }
});

module.exports = upload;
