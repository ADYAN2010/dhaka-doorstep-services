-- 006_bookings.sql
-- Depends on customers (002) and providers (003).
CREATE TABLE IF NOT EXISTS `bookings` (
  `id`                  CHAR(36)     NOT NULL,
  `customer_id`         CHAR(36)     NULL,
  `provider_id`         CHAR(36)     NULL,
  `full_name`           VARCHAR(255) NOT NULL,
  `phone`               VARCHAR(40)  NOT NULL,
  `email`               VARCHAR(255) NULL,
  `category`            VARCHAR(150) NOT NULL,
  `service`             VARCHAR(150) NULL,
  `area`                VARCHAR(150) NOT NULL,
  `address`             TEXT         NULL,
  `preferred_date`      DATE         NOT NULL,
  `preferred_time_slot` VARCHAR(40)  NOT NULL,
  `budget_range`        VARCHAR(80)  NULL,
  `notes`               TEXT         NULL,
  `status`              ENUM('new','confirmed','assigned','completed','cancelled') NOT NULL DEFAULT 'new',
  `created_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_booking_status` (`status`),
  KEY `ix_booking_customer` (`customer_id`),
  KEY `ix_booking_provider` (`provider_id`),
  KEY `ix_booking_created` (`created_at`),
  CONSTRAINT `fk_booking_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_booking_provider` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
