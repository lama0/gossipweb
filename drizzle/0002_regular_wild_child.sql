CREATE TABLE `bestie_candidates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bestie_candidates_position_unique` ON `bestie_candidates` (`position`);--> statement-breakpoint
CREATE TABLE `bestie_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`week_key` text NOT NULL,
	`candidate_id` integer NOT NULL,
	`voter_id` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bestie_votes_week_voter` ON `bestie_votes` (`week_key`,`voter_id`);--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`event_date` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`creator_id` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `drama_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`newsletter_id` integer NOT NULL,
	`author_id` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `newsletter` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `poll_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`poll_id` integer NOT NULL,
	`label` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `poll_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`poll_id` integer NOT NULL,
	`option_id` integer NOT NULL,
	`voter_id` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_poll_votes_poll_voter` ON `poll_votes` (`poll_id`,`voter_id`);--> statement-breakpoint
CREATE TABLE `polls` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question` text NOT NULL,
	`creator_id` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform_id` text NOT NULL,
	`real_name` text NOT NULL,
	`nickname` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_platform_id_unique` ON `profiles` (`platform_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_nickname_unique` ON `profiles` (`nickname`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `song_suggestions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`creator_id` integer NOT NULL,
	`created_at` integer NOT NULL
);
