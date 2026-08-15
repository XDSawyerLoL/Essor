CREATE TABLE `essor_circle_reports` (
	`post_id` text NOT NULL,
	`reporter_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`post_id`, `reporter_hash`)
);
--> statement-breakpoint
CREATE INDEX `essor_circle_reports_post_idx` ON `essor_circle_reports` (`post_id`);--> statement-breakpoint
CREATE INDEX `essor_circle_reports_reporter_idx` ON `essor_circle_reports` (`reporter_hash`,`created_at`);