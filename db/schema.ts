import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  realName: text("real_name").notNull(),
  nickname: text("nickname").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const suggestions = sqliteTable("suggestions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  realName: text("real_name").notNull(),
  nickname: text("nickname").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const profiles = sqliteTable("profiles", {
  avatarKey: text("avatar_key").notNull().default(""),
  id: integer("id").primaryKey({ autoIncrement: true }), platformId: text("platform_id").notNull().unique(), realName: text("real_name").notNull(), nickname: text("nickname").notNull().unique(), isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false), createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  accountId: integer("account_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});
export const polls = sqliteTable("polls", { id: integer("id").primaryKey({ autoIncrement: true }), question: text("question").notNull(), creatorId: integer("creator_id").notNull(), createdAt: integer("created_at", { mode: "timestamp" }).notNull() });
export const pollOptions = sqliteTable("poll_options", { id: integer("id").primaryKey({ autoIncrement: true }), pollId: integer("poll_id").notNull(), label: text("label").notNull() });
export const pollVotes = sqliteTable("poll_votes", { id: integer("id").primaryKey({ autoIncrement: true }), pollId: integer("poll_id").notNull(), optionId: integer("option_id").notNull(), voterId: integer("voter_id").notNull() }, (t) => [uniqueIndex("idx_poll_votes_poll_voter").on(t.pollId, t.voterId)]);
export const calendarEvents = sqliteTable("calendar_events", { id: integer("id").primaryKey({ autoIncrement: true }), title: text("title").notNull(), eventDate: text("event_date").notNull(), eventTime: text("event_time").notNull().default(""), endDate: text("end_date").notNull().default(""), endTime: text("end_time").notNull().default(""), category: text("category").notNull().default("Event"), allDay: integer("all_day").notNull().default(0), location: text("location").notNull().default(""), reminder: text("reminder").notNull().default("none"), color: text("color").notNull().default("pink"), details: text("details").notNull().default(""), creatorId: integer("creator_id").notNull(), createdAt: integer("created_at", { mode: "timestamp" }).notNull() });
export const songSuggestions = sqliteTable("song_suggestions", { id: integer("id").primaryKey({ autoIncrement: true }), title: text("title").notNull(), artist: text("artist").notNull(), creatorId: integer("creator_id").notNull(), createdAt: integer("created_at", { mode: "timestamp" }).notNull() });
export const newsletter = sqliteTable("newsletter", { id: integer("id").primaryKey({ autoIncrement: true }), category: text("category").notNull(), title: text("title").notNull(), body: text("body").notNull(), imageKey: text("image_key"), createdAt: integer("created_at", { mode: "timestamp" }).notNull() });
export const dramaComments = sqliteTable("drama_comments", { id: integer("id").primaryKey({ autoIncrement: true }), newsletterId: integer("newsletter_id").notNull(), authorId: integer("author_id").notNull(), body: text("body").notNull(), createdAt: integer("created_at", { mode: "timestamp" }).notNull() });
export const bestieCandidates = sqliteTable("bestie_candidates", { id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(), position: integer("position").notNull().unique() });
export const bestieVotes = sqliteTable("bestie_votes", { id: integer("id").primaryKey({ autoIncrement: true }), weekKey: text("week_key").notNull(), candidateId: integer("candidate_id").notNull(), voterId: integer("voter_id").notNull() }, (t) => [uniqueIndex("idx_bestie_votes_week_voter").on(t.weekKey, t.voterId)]);
export const siteSettings = sqliteTable("site_settings", { key: text("key").primaryKey(), value: text("value").notNull() });
