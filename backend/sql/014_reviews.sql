-- 014_reviews.sql — customer reviews of providers.
-- Booking_id is optional; for now we let customers post a review against a
-- provider they've interacted with. A unique constraint prevents the same
-- customer from posting more than one review per provider.

CREATE TABLE IF NOT EXISTS `reviews` (
  `id`          CHAR(36)     NOT NULL,
  `provider_id` CHAR(36)     NOT NULL,
  `customer_id` CHAR(36)     NOT NULL,
  `booking_id`  CHAR(36)     NULL,
  `rating`      TINYINT      NOT NULL,
  `comment`     TEXT         NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_review_provider_customer` (`provider_id`, `customer_id`),
  KEY `ix_review_provider` (`provider_id`),
  KEY `ix_review_customer` (`customer_id`),
  KEY `ix_review_created` (`created_at`),
  CONSTRAINT `fk_review_provider` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_review_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger: keep providers.rating + review_count in sync after every change.
DROP TRIGGER IF EXISTS `trg_reviews_after_insert`;
CREATE TRIGGER `trg_reviews_after_insert` AFTER INSERT ON `reviews`
FOR EACH ROW
  UPDATE `providers` p SET
    p.review_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = NEW.provider_id),
    p.rating       = (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE provider_id = NEW.provider_id)
  WHERE p.id = NEW.provider_id;

DROP TRIGGER IF EXISTS `trg_reviews_after_update`;
CREATE TRIGGER `trg_reviews_after_update` AFTER UPDATE ON `reviews`
FOR EACH ROW
  UPDATE `providers` p SET
    p.review_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = NEW.provider_id),
    p.rating       = (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE provider_id = NEW.provider_id)
  WHERE p.id = NEW.provider_id;

DROP TRIGGER IF EXISTS `trg_reviews_after_delete`;
CREATE TRIGGER `trg_reviews_after_delete` AFTER DELETE ON `reviews`
FOR EACH ROW
  UPDATE `providers` p SET
    p.review_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = OLD.provider_id),
    p.rating       = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE provider_id = OLD.provider_id), 0)
  WHERE p.id = OLD.provider_id;
