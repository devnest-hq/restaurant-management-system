const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary-v2");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "rms-menu-items",
    allowed_formats: async (req, res) => ["png", "jpeg", "jpg", "webp"]
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only PNG, JPEG, JPG, and WebP images are allowed"));
    }
    cb(null, true);
  },
});

module.exports = upload;