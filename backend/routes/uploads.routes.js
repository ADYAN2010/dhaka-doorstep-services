/**
 * /api/uploads — file upload endpoint, writes to ./uploads on the server.
 *
 * In production behind Nginx, mount /uploads as a static alias pointing
 * at <repo>/backend/uploads (or whatever UPLOADS_DIR resolves to).
 * In dev, this server serves them at GET /uploads/<filename> directly.
 *
 * Auth: any logged-in user (admin OR customer) can upload.
 * Limits: 5MB per file, single file per request, allow-listed mime types.
 */
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { HttpError, asyncHandler } = require("../middleware/error-handler");

const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads"));
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.\w]/g, "").slice(0, 10);
    const id = crypto.randomBytes(16).toString("hex");
    cb(null, `${Date.now()}-${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new HttpError(400, `Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

router.post(
  "/",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "No file uploaded (field name must be 'file')");
    const publicUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({
      url: publicUrl,
      filename: req.file.filename,
      size: req.file.size,
      mime_type: req.file.mimetype,
    });
  }),
);

module.exports = { router, UPLOADS_DIR };
