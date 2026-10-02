CREATE TABLE `suggestions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`real_name` text NOT NULL,
	`nickname` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
