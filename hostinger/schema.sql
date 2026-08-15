CREATE TABLE IF NOT EXISTS essor_subscriptions (
  subscription_id VARCHAR(255) PRIMARY KEY NOT NULL,
  checkout_session_id VARCHAR(255) NULL,
  customer_id VARCHAR(255) NULL,
  plan VARCHAR(16) NOT NULL DEFAULT 'monthly',
  status VARCHAR(32) NOT NULL DEFAULT 'trialing',
  cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0,
  current_period_end BIGINT NULL,
  trial_end BIGINT NULL,
  updated_at BIGINT NOT NULL,
  UNIQUE KEY essor_subscriptions_checkout_session_idx (checkout_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS essor_circle_posts (
  id CHAR(36) PRIMARY KEY NOT NULL,
  author_hash CHAR(64) NOT NULL,
  alias VARCHAR(96) NOT NULL,
  message_key VARCHAR(64) NOT NULL,
  days INT NULL,
  created_at BIGINT NOT NULL,
  KEY essor_circle_posts_created_idx (created_at),
  KEY essor_circle_posts_author_idx (author_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS essor_circle_supports (
  post_id CHAR(36) NOT NULL,
  supporter_hash CHAR(64) NOT NULL,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (post_id, supporter_hash),
  KEY essor_circle_supports_post_idx (post_id),
  KEY essor_circle_supports_supporter_idx (supporter_hash, created_at),
  CONSTRAINT essor_circle_supports_post_fk FOREIGN KEY (post_id) REFERENCES essor_circle_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS essor_circle_reports (
  post_id CHAR(36) NOT NULL,
  reporter_hash CHAR(64) NOT NULL,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (post_id, reporter_hash),
  KEY essor_circle_reports_post_idx (post_id),
  KEY essor_circle_reports_reporter_idx (reporter_hash, created_at),
  CONSTRAINT essor_circle_reports_post_fk FOREIGN KEY (post_id) REFERENCES essor_circle_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS essor_presence (
  session_hash CHAR(64) PRIMARY KEY NOT NULL,
  last_seen BIGINT NOT NULL,
  KEY essor_presence_last_seen_idx (last_seen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
