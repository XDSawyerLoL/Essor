CREATE TABLE `essor_circle_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`author_hash` text NOT NULL,
	`alias` text NOT NULL,
	`message_key` text NOT NULL,
	`days` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `essor_circle_posts_created_idx` ON `essor_circle_posts` (`created_at`);--> statement-breakpoint
CREATE INDEX `essor_circle_posts_author_idx` ON `essor_circle_posts` (`author_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `essor_circle_supports` (
	`post_id` text NOT NULL,
	`supporter_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`post_id`, `supporter_hash`)
);
--> statement-breakpoint
CREATE INDEX `essor_circle_supports_post_idx` ON `essor_circle_supports` (`post_id`);