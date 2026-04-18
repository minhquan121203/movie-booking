import multer from "multer";
import path from "path";
import { errorResponse } from "../utils/response.js";

// Configure storage (memory storage for Cloudinary)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)"), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Upload middleware functions
const uploadMiddleware = {
  // Single image upload
  single: (fieldName) => {
    return (req, res, next) => {
      const uploadSingle = upload.single(fieldName);

      uploadSingle(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return errorResponse(res, "File quá lớn. Kích thước tối đa 5MB", 400);
          }
          return errorResponse(res, err.message, 400);
        } else if (err) {
          return errorResponse(res, err.message, 400);
        }
        next();
      });
    };
  },

  // Multiple images upload
  multiple: (fieldName, maxCount = 10) => {
    return (req, res, next) => {
      const uploadMultiple = upload.array(fieldName, maxCount);

      uploadMultiple(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return errorResponse(res, "File quá lớn. Kích thước tối đa 5MB cho mỗi file", 400);
          }
          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return errorResponse(res, `Chỉ được upload tối đa ${maxCount} file`, 400);
          }
          return errorResponse(res, err.message, 400);
        } else if (err) {
          return errorResponse(res, err.message, 400);
        }
        next();
      });
    };
  },

  // Multiple fields upload
  fields: (fields) => {
    return (req, res, next) => {
      const uploadFields = upload.fields(fields);

      uploadFields(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return errorResponse(res, "File quá lớn. Kích thước tối đa 5MB", 400);
          }
          return errorResponse(res, err.message, 400);
        } else if (err) {
          return errorResponse(res, err.message, 400);
        }
        next();
      });
    };
  },
};

export default uploadMiddleware;
