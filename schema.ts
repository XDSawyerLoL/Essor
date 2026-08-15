import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const essorSubscriptions = sqliteTable(
  "essor_subscriptions",
  {
    subscriptionId: text("subscription_id").primaryKey(),
    checkoutSessionId: text("checkout_session_id"),
    customerId: text("customer_id"),
    plan: text("plan").notNull().default("monthly"),
    status: text("status").notNull().default("trialing"),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false),
    currentPeriodEnd: integer("current_period_end"),
    trialEnd: integer("trial_end"),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [uniqueIndex("essor_subscriptions_checkout_session_idx").on(table.checkoutSessionId)],
);

export const essorCirclePosts = sqliteTable(
  "essor_circle_posts",
  {
    id: text("id").primaryKey(),
    authorHash: text("author_hash").notNull(),
    alias: text("alias").notNull(),
    messageKey: text("message_key").notNull(),
    days: integer("days"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("essor_circle_posts_created_idx").on(table.createdAt),
    index("essor_circle_posts_author_idx").on(table.authorHash, table.createdAt),
  ],
);

export const essorCircleSupports = sqliteTable(
  "essor_circle_supports",
  {
    postId: text("post_id").notNull(),
    supporterHash: text("supporter_hash").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.supporterHash] }),
    index("essor_circle_supports_post_idx").on(table.postId),
  ],
);

export const essorCircleReports = sqliteTable(
  "essor_circle_reports",
  {
    postId: text("post_id").notNull(),
    reporterHash: text("reporter_hash").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.reporterHash] }),
    index("essor_circle_reports_post_idx").on(table.postId),
    index("essor_circle_reports_reporter_idx").on(table.reporterHash, table.createdAt),
  ],
);

export const essorPresence = sqliteTable(
  "essor_presence",
  {
    sessionHash: text("session_hash").primaryKey(),
    lastSeen: integer("last_seen").notNull(),
  },
  (table) => [index("essor_presence_last_seen_idx").on(table.lastSeen)],
);
