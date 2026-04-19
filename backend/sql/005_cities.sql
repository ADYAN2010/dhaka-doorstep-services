-- 005_cities.sql
CREATE TABLE IF NOT EXISTS `cities` (
  `id`             CHAR(36)     NOT NULL,
  `slug`           VARCHAR(100) NOT NULL,
  `name`           VARCHAR(150) NOT NULL,
  `country`        VARCHAR(100) NOT NULL DEFAULT 'Bangladesh',
  `launch_status`  ENUM('coming_soon','beta','live','paused') NOT NULL DEFAULT 'coming_soon',
  `is_active`      TINYINT(1)   NOT NULL DEFAULT 1,
  `display_order`  INT          NOT NULL DEFAULT 0,
  `launched_at`    DATETIME     NULL,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_city_slug` (`slug`),
  KEY `ix_city_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
