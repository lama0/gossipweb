ALTER TABLE `calendar_events` ADD `end_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `end_time` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `category` text DEFAULT 'Event' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `all_day` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `location` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `reminder` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `color` text DEFAULT 'pink' NOT NULL;