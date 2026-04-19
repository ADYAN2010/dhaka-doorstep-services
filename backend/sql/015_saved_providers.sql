-- 015_saved_providers.sql — customers' favorite-provider list.
CREATE TABLE IF NOT EXISTS `saved_providers` (
  `id`          CHAR(36)     NOT NULL,
  `customer_id` CHAR(36)     NOT NULL,
  `provider_id` CHAR(36)     NOT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_saved_customer_provider` (`customer_id`, `provider_id`),
  KEY `ix_saved_provider` (`provider_id`),
  CONSTRAINT `fk_saved_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_saved_provider` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
