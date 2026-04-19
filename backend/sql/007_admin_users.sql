-- 007_admin_users.sql
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id`            CHAR(36)      NOT NULL,
  `email`         VARCHAR(255)  NOT NULL,
  `full_name`     VARCHAR(255)  NOT NULL,
  `password_hash` VARCHAR(255)  NOT NULL,
  `role`          ENUM('superadmin','admin','staff') NOT NULL DEFAULT 'admin',
  `is_active`     TINYINT(1)    NOT NULL DEFAULT 1,
  `last_login_at` DATETIME      NULL,
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_email` (`email`),
  KEY `ix_admin_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
