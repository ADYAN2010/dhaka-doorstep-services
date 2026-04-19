-- 013_provider_detail.sql — extend providers + join tables for the public directory.
-- Adds slug, bio, avatar, business name, response time, years experience,
-- jobs completed, languages, gallery and pricing label.

ALTER TABLE `providers`
  ADD COLUMN `slug`              VARCHAR(120)  NULL AFTER `id`,
  ADD COLUMN `business_name`     VARCHAR(255)  NULL AFTER `full_name`,
  ADD COLUMN `provider_type`     ENUM('individual','agency') NOT NULL DEFAULT 'individual' AFTER `business_name`,
  ADD COLUMN `avatar_url`        TEXT          NULL AFTER `phone`,
  ADD COLUMN `bio`               TEXT          NULL AFTER `avatar_url`,
  ADD COLUMN `pricing_label`     VARCHAR(120)  NULL AFTER `bio`,
  ADD COLUMN `response_time`     VARCHAR(80)   NULL AFTER `pricing_label`,
  ADD COLUMN `years_experience`  INT           NOT NULL DEFAULT 0 AFTER `response_time`,
  ADD COLUMN `jobs_completed`    INT           NOT NULL DEFAULT 0 AFTER `years_experience`,
  ADD COLUMN `languages`         VARCHAR(255)  NULL AFTER `jobs_completed`,
  ADD COLUMN `gallery`           JSON          NULL AFTER `languages`,
  ADD COLUMN `is_verified`       TINYINT(1)    NOT NULL DEFAULT 0 AFTER `gallery`,
  ADD COLUMN `is_top_rated`      TINYINT(1)    NOT NULL DEFAULT 0 AFTER `is_verified`,
  ADD UNIQUE KEY `uq_provider_slug` (`slug`);

-- Many-to-many: provider ↔ category (by slug, not FK, so seed is independent of categories table).
CREATE TABLE IF NOT EXISTS `provider_category_links` (
  `id`            CHAR(36)     NOT NULL,
  `provider_id`   CHAR(36)     NOT NULL,
  `category_slug` VARCHAR(120) NOT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_provider_category` (`provider_id`, `category_slug`),
  KEY `ix_pcl_category` (`category_slug`),
  CONSTRAINT `fk_pcl_provider` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Many-to-many: provider ↔ area (slug-based).
CREATE TABLE IF NOT EXISTS `provider_area_links` (
  `id`          CHAR(36)     NOT NULL,
  `provider_id` CHAR(36)     NOT NULL,
  `area_slug`   VARCHAR(120) NOT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_provider_area` (`provider_id`, `area_slug`),
  KEY `ix_pal_area` (`area_slug`),
  CONSTRAINT `fk_pal_provider` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weekly availability windows per provider.
CREATE TABLE IF NOT EXISTS `provider_availability` (
  `id`          CHAR(36)   NOT NULL,
  `provider_id` CHAR(36)   NOT NULL,
  `weekday`     TINYINT    NOT NULL,             -- 0=Sun … 6=Sat
  `start_time`  TIME       NOT NULL,
  `end_time`    TIME       NOT NULL,
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pa_provider_day_window` (`provider_id`, `weekday`, `start_time`),
  KEY `ix_pa_weekday` (`weekday`),
  CONSTRAINT `fk_pa_provider` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
