-- 010_contact_messages.sql
-- Public contact form submissions.
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id`         CHAR(36)     NOT NULL,
  `customer_id` CHAR(36)    NULL,
  `full_name`  VARCHAR(150) NOT NULL,
  `email`      VARCHAR(255) NOT NULL,
  `phone`      VARCHAR(40)  NULL,
  `message`    TEXT         NOT NULL,
  `handled`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_contact_handled` (`handled`),
  KEY `ix_contact_created` (`created_at`),
  CONSTRAINT `fk_contact_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
