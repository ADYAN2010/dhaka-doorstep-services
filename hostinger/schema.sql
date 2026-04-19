-- =====================================================================
-- Shebabd · Hostinger MySQL schema (Phase 1)
-- Import via phpMyAdmin → SQL tab. Safe to re-run on an empty DB.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------- admin_users ----------
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
  UNIQUE KEY `uq_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- cities ----------
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

-- ---------- areas (under a city) ----------
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
  CONSTRAINT `fk_area_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- zones (pricing modifiers per city) ----------
CREATE TABLE IF NOT EXISTS `zones` (
  `id`               CHAR(36)      NOT NULL,
  `city_id`          CHAR(36)      NOT NULL,
  `name`             VARCHAR(150)  NOT NULL,
  `pricing_modifier` DECIMAL(5,2)  NOT NULL DEFAULT 1.00,
  `is_active`        TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_zone_city` (`city_id`),
  CONSTRAINT `fk_zone_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- categories ----------
CREATE TABLE IF NOT EXISTS `categories` (
  `id`              CHAR(36)      NOT NULL,
  `slug`            VARCHAR(100)  NOT NULL,
  `name`            VARCHAR(150)  NOT NULL,
  `commission_rate` DECIMAL(5,2)  NOT NULL DEFAULT 10.00,
  `is_active`       TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_category_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- services (subcategories) ----------
CREATE TABLE IF NOT EXISTS `services` (
  `id`            CHAR(36)      NOT NULL,
  `category_id`   CHAR(36)      NOT NULL,
  `slug`          VARCHAR(100)  NOT NULL,
  `name`          VARCHAR(150)  NOT NULL,
  `description`   TEXT          NULL,
  `base_price`    DECIMAL(10,2) NULL,
  `is_active`     TINYINT(1)    NOT NULL DEFAULT 1,
  `is_featured`   TINYINT(1)    NOT NULL DEFAULT 0,
  `is_seasonal`   TINYINT(1)    NOT NULL DEFAULT 0,
  `is_trending`   TINYINT(1)    NOT NULL DEFAULT 0,
  `display_order` INT           NOT NULL DEFAULT 0,
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_service_cat_slug` (`category_id`, `slug`),
  KEY `ix_service_category` (`category_id`),
  CONSTRAINT `fk_service_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- customers ----------
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
  KEY `ix_customer_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- providers ----------
CREATE TABLE IF NOT EXISTS `providers` (
  `id`              CHAR(36)     NOT NULL,
  `full_name`       VARCHAR(255) NOT NULL,
  `email`           VARCHAR(255) NULL,
  `phone`           VARCHAR(40)  NULL,
  `primary_area`    VARCHAR(150) NULL,
  `primary_category` VARCHAR(150) NULL,
  `status`          ENUM('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  `rating`          DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `review_count`    INT          NOT NULL DEFAULT 0,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_provider_email` (`email`),
  KEY `ix_provider_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- bookings ----------
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

-- ---------- reviews ----------
CREATE TABLE IF NOT EXISTS `reviews` (
  `id`          CHAR(36)     NOT NULL,
  `booking_id`  CHAR(36)     NOT NULL,
  `customer_id` CHAR(36)     NULL,
  `provider_id` CHAR(36)     NOT NULL,
  `rating`      TINYINT      NOT NULL,
  `comment`     TEXT         NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_review_provider` (`provider_id`),
  KEY `ix_review_booking` (`booking_id`),
  CONSTRAINT `fk_review_provider` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_review_booking`  FOREIGN KEY (`booking_id`)  REFERENCES `bookings`  (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- support_tickets ----------
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id`             CHAR(36)     NOT NULL,
  `subject`        VARCHAR(255) NOT NULL,
  `body`           TEXT         NOT NULL,
  `requester_name` VARCHAR(255) NOT NULL,
  `requester_email` VARCHAR(255) NOT NULL,
  `category`       VARCHAR(80)  NOT NULL DEFAULT 'general',
  `priority`       ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  `status`         ENUM('open','pending','solved','closed') NOT NULL DEFAULT 'open',
  `assignee_id`    CHAR(36)     NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_ticket_status` (`status`),
  KEY `ix_ticket_assignee` (`assignee_id`),
  CONSTRAINT `fk_ticket_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- SEED DATA — minimal, idempotent (uses INSERT IGNORE on UNIQUE keys)
-- =====================================================================

-- Default super-admin. Password hash below is for the literal string
-- "ChangeMe!2025" — log in once, then change it from the admin console.
-- Generate your own with PHP:  echo password_hash('your-pw', PASSWORD_BCRYPT);
INSERT IGNORE INTO `admin_users`
  (`id`, `email`, `full_name`, `password_hash`, `role`, `is_active`)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   'admin@shebabd.local',
   'Super Admin',
   '$2y$10$8qXkUq7m1Sa7N2g0Q.0J1uYwG9k4w.6Xq7H4l2y9V1m3a8c0PqL2.',
   'superadmin',
   1);

-- Cities
INSERT IGNORE INTO `cities` (`id`, `slug`, `name`, `country`, `launch_status`, `is_active`, `display_order`) VALUES
  ('11111111-1111-1111-1111-111111111101', 'dhaka',      'Dhaka',      'Bangladesh', 'live',         1, 1),
  ('11111111-1111-1111-1111-111111111102', 'chattogram', 'Chattogram', 'Bangladesh', 'coming_soon',  1, 2),
  ('11111111-1111-1111-1111-111111111103', 'sylhet',     'Sylhet',     'Bangladesh', 'coming_soon',  1, 3);

-- Categories
INSERT IGNORE INTO `categories` (`id`, `slug`, `name`, `commission_rate`, `is_active`) VALUES
  ('22222222-2222-2222-2222-222222222201', 'cleaning',   'Cleaning',   12.00, 1),
  ('22222222-2222-2222-2222-222222222202', 'plumbing',   'Plumbing',   15.00, 1),
  ('22222222-2222-2222-2222-222222222203', 'electrical', 'Electrical', 15.00, 1),
  ('22222222-2222-2222-2222-222222222204', 'ac-repair',  'AC Repair',  18.00, 1);
