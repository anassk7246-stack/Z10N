import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users.js';

export const credentials = pgTable(
  'credentials',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    service: text('service').notNull(),
    encryptedData: text('encrypted_data').notNull(),
    iv: text('iv').notNull(),
    authTag: text('auth_tag').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index('credentials_user_id_idx').on(table.userId),
    userServiceIdx: index('credentials_user_id_service_idx').on(
      table.userId,
      table.service,
    ),
  }),
);

export const credentialsRelations = relations(credentials, ({ one }) => ({
  user: one(users, {
    fields: [credentials.userId],
    references: [users.id],
  }),
}));

export type Credential    = typeof credentials.$inferSelect;
export type NewCredential = typeof credentials.$inferInsert;
export type CredentialPublic = Pick<Credential, 'id' | 'name' | 'service' | 'createdAt'>;

export interface CredentialPlaintext {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  [key: string]: string | undefined;
}

export type CredentialService =
  | 'gemini' | 'openai' | 'anthropic'
  | 'sendgrid' | 'slack' | 'github' | 'generic-api-key';
