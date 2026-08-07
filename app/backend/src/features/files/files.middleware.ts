import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { MAX_FILE_SIZE, validateFileExtension } from './files.validation.js';

const tempDir = path.resolve(process.cwd(), 'storage', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    const { isValid, error } = validateFileExtension(file.originalname);
    if (!isValid) {
      return cb(new Error(error || 'Invalid file type'));
    }
    cb(null, true);
  },
});
