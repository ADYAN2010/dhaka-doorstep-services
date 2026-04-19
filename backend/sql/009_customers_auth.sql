-- 009_customers_auth.sql
-- Add auth columns to customers so they can sign up/log in via the MySQL backend.
ALTER TABLE `customers`
  ADD COLUMN IF NOT EXISTS `password_hash`        VARCHAR(255) NULL AFTER `area`,
  ADD COLUMN IF NOT EXISTS `email_verified_at`    DATETIME     NULL AFTER `password_hash`,
  ADD COLUMN IF NOT EXISTS `password_reset_token` VARCHAR(128) NULL AFTER `email_verified_at`,
  ADD COLUMN IF NOT EXISTS `password_reset_expires_at` DATETIME NULL AFTER `password_reset_token`,
  ADD COLUMN IF NOT EXISTS `last_login_at`        DATETIME     NULL AFTER `password_reset_expires_at`;

-- Index for password reset lookups (token is short-lived but should be queryable).
CREATE INDEX IF NOT EXISTS `ix_customer_reset_token` ON `customers` (`password_reset_token`);
