CREATE TABLE `essor_subscriptions` (
	`subscription_id` text PRIMARY KEY NOT NULL,
	`checkout_session_id` text,
	`customer_id` text,
	`plan` text DEFAULT 'monthly' NOT NULL,
	`status` text DEFAULT 'trialing' NOT NULL,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	`current_period_end` integer,
	`trial_end` integer,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `essor_subscriptions_checkout_session_idx` ON `essor_subscriptions` (`checkout_session_id`);