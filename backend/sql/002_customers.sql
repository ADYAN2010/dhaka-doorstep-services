-- 002_customers.sql
CREATE TABLE IF NOT EXISTS `customers` (
  `id`         CHAR(36)     NOT NULL,
  `full_name`  VARCHAR(255) NOT NULL,
  `email`      VARCHAR(255) NULL,
  `phone`      VARCHAR(40)  NULL,
  `area`       VARCHAR(150) NULL,
  `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_email` (`email`),
  KEY `ix_customer_phone` (`phone`),
  KEY `ix_customer_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
