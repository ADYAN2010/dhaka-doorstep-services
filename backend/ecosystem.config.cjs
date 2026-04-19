/**
 * PM2 process config for Hostinger VPS / Cloud (and Render/Railway/Fly).
 * Usage on the server:
 *   npm --prefix backend ci --omit=dev
 *   npm --prefix backend run migrate
 *   pm2 start backend/ecosystem.config.cjs
 *   pm2 save && pm2 startup
 *
 * On Hostinger Node.js Apps you don't need PM2 — the panel manages the
 * process. This file is for VPS or any host where you run Node yourself.
 */
module.exports = {
  apps: [
    {
      name: "shobsheba-backend",
      script: "server.js",
      cwd: __dirname,
      instances: 1, // bump to "max" once your DB pool can handle it
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "300M",
      out_file: "./logs/out.log",
      error_file: "./logs/err.log",
      time: true,
    },
  ],
};
