-- 004_categories.sql
CREATE TABLE IF NOT EXISTS `categories` (
  `id`              CHAR(36)      NOT NULL,
  `slug`            VARCHAR(100)  NOT NULL,
  `name`            VARCHAR(150)  NOT NULL,
  `commission_rate` DECIMAL(5,2)  NOT NULL DEFAULT 10.00,
  `is_active`       TINYINT(1)    NOT NULL DEFAULT 1,
  `display_order`   INT           NOT NULL DEFAULT 0,
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_category_slug` (`slug`),
  KEY `ix_category_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
