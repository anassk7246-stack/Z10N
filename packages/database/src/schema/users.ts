import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { workflows } from './workflows.js';
import { credentials } from './credentials.js';

export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name'),
    timezone: text('timezone').notNull().default('UTC'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex('users_email_unique_idx').on(table.email),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  workflows:   many(workflows),
  credentials: many(credentials),
}));

export type User    = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserPublic = Pick<User, 'id'
