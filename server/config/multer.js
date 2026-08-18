const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary-v2");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "rms-menu-items",
    allowed_formats: async (req, res) => ["png", "jpeg", "jpg"]
  },
});

const upload = multer({ storage: storage });

module.exports = upload;