-- 008_locations.sql
-- Areas live under cities; supports city/area dropdowns in admin and booking forms.
CREATE TABLE IF NOT EXISTS `areas` (
  `id`            CHAR(36)     NOT NULL,
  `city_id`       CHAR(36)     NOT NULL,
  `slug`          VARCHAR(100) NOT NULL,
  `name`          VARCHAR(150) NOT NULL,
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `display_order` INT          NOT NULL DEFAULT 0,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_area_city_slug` (`city_id`, `slug`),
  KEY `ix_area_city` (`city_id`),
  KEY `ix_area_active` (`is_active`),
  CONSTRAINT `fk_area_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
