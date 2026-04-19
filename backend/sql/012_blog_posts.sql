-- 012_blog_posts.sql
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id`             CHAR(36)     NOT NULL,
  `slug`           VARCHAR(180) NOT NULL,
  `title`          VARCHAR(255) NOT NULL,
  `excerpt`        TEXT         NOT NULL,
  `body`           MEDIUMTEXT   NOT NULL,
  `cover_image_url` VARCHAR(500) NULL,
  `tag`            VARCHAR(80)  NOT NULL DEFAULT 'general',
  `read_minutes`   INT          NOT NULL DEFAULT 5,
  `published`      TINYINT(1)   NOT NULL DEFAULT 0,
  `published_at`   DATETIME     NULL,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_blog_slug` (`slug`),
  KEY `ix_blog_published` (`published`, `published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
