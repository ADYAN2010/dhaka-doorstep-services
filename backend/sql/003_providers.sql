-- 003_providers.sql
CREATE TABLE IF NOT EXISTS `providers` (
  `id`               CHAR(36)     NOT NULL,
  `full_name`        VARCHAR(255) NOT NULL,
  `email`            VARCHAR(255) NULL,
  `phone`            VARCHAR(40)  NULL,
  `primary_area`     VARCHAR(150) NULL,
  `primary_category` VARCHAR(150) NULL,
  `status`           ENUM('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  `rating`           DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `review_count`     INT          NOT NULL DEFAULT 0,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_provider_email` (`email`),
  KEY `ix_provider_status` (`status`),
  KEY `ix_provider_area` (`primary_area`),
  KEY `ix_provider_category` (`primary_category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
