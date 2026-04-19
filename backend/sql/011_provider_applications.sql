-- 011_provider_applications.sql
-- Public 'become a provider' applications.
CREATE TABLE IF NOT EXISTS `provider_applications` (
  `id`             CHAR(36)     NOT NULL,
  `customer_id`    CHAR(36)     NULL,
  `full_name`      VARCHAR(150) NOT NULL,
  `phone`          VARCHAR(40)  NOT NULL,
  `email`          VARCHAR(255) NOT NULL,
  `applicant_type` VARCHAR(80)  NOT NULL,
  `category`       VARCHAR(150) NOT NULL,
  `experience`     VARCHAR(40)  NOT NULL,
  `coverage_area`  VARCHAR(150) NOT NULL,
  `team_size`      VARCHAR(20)  NULL,
  `availability`   VARCHAR(40)  NULL,
  `about`          TEXT         NULL,
  `status`         ENUM('new','reviewing','approved','rejected') NOT NULL DEFAULT 'new',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_app_status` (`status`),
  KEY `ix_app_created` (`created_at`),
  CONSTRAINT `fk_app_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
