<?php
/**
 * Copy this file to `config.php` on Hostinger and fill in real values.
 * NEVER commit config.php — only this example file.
 */
declare(strict_types=1);

define('DB_HOST', 'localhost');          // usually localhost on Hostinger
define('DB_PORT', 3306);
define('DB_NAME', 'u123456789_shebabd'); // your database name
define('DB_USER', 'u123456789_admin');   // your DB user
define('DB_PASS', 'your-strong-db-password');

// MUST match HOSTINGER_BRIDGE_SECRET set in Lovable Cloud secrets.
// Generate a long random string (e.g. `openssl rand -hex 48`).
define('BRIDGE_SECRET', 'replace-with-the-same-long-random-string');
