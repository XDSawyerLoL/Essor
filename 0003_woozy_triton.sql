CREATE TABLE `essor_presence` (
	`session_hash` text PRIMARY KEY NOT NULL,
	`last_seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `essor_presence_last_seen_idx` ON `essor_presence` (`last_seen`);