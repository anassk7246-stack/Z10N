import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { workflows } from './workflows.js';

export type TriggerType  = 'webhook' | 'manual' | 'cron';
export type WebhookMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface WebhookTriggerConfig {
  method: WebhookMethod;
  respondWith: 'ack' | 'lastNodeOutput';
  hmacSecret: string | null;
}
export interface ManualTriggerConfig {
  testPayload: Record<string, unknown>;
}
export interface CronTriggerConfig {
  expression: string;
  timezone: string;
}
export type TriggerConfig =
  | WebhookTriggerConfig
  | ManualTriggerConfig
  | CronTriggerConfig;

export const triggers = pgTable(
  'triggers',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
    type: text('type').$type<TriggerType>().notNull(),
    config: jsonb('config').$type<TriggerConfig>().notNull(),
    webhookPath: text('webhook_path'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    workflowUnique: uniqueIndex('triggers_workflow_id_unique_idx').on(table.workflowId),
    webhookPathIdx: uniqueIndex('triggers_webhook_path_unique_idx').on(table.webhookPath),
    typeIdx: index('triggers_type_idx').on(table.type),
  }),
);

export const triggersRelations = relations(triggers, ({ one }) => ({
  workflow: one(workflows, {
    fields: [triggers.workflowId],
    references: [workflows.id],
  }),
}));

export type Trigger    = typeof triggers.$inferSelect;
export type NewTrigger = typeof triggers.$inferInsert;

export type WebhookTrigger = Trigger & {
  type: 'webhook';
  config: WebhookTriggerConfig;
  webhookPath: string;
};
export type ManualTrigger = Trigger & {
  type: 'manual';
  config: ManualTriggerConfig;
};
