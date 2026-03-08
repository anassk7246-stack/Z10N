import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users.js';
import { triggers } from './triggers.js';
import { executions } from './executions.js';

export const workflows = pgTable(
  'workflows',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(false),
    activeVersionId: uuid('active_version_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index('workflows_user_id_idx').on(table.userId),
  }),
);

export const workflowVersions = pgTable(
  'workflow_versions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    graph: jsonb('graph').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    workflowVersionUnique: uniqueIndex('workflow_versions_workflow_id_version_idx').on(
      table.workflowId,
      table.version,
    ),
    workflowIdIdx: index('workflow_versions_workflow_id_idx').on(table.workflowId),
  }),
);

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  user: one(users, {
    fields: [workflows.userId],
    references: [users.id],
  }),
  versions: many(workflowVersions),
  activeVersion: one(workflowVersions, {
    fields: [workflows.activeVersionId],
    references: [workflowVersions.id],
  }),
  trigger: one(triggers, {
    fields: [workflows.id],
    references: [triggers.workflowId],
  }),
  executions: many(executions),
}));

export const workflowVersionsRelations = relations(workflowVersions, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowVersions.workflowId],
    references: [workflows.id],
  }),
}));

export type Workflow        = typeof workflows.$inferSelect;
export type NewWorkflow     = typeof workflows.$inferInsert;
export type WorkflowVersion    = typeof workflowVersions.$inferSelect;
export type NewWorkflowVersion = typeof workflowVersions.$inferInsert;

export interface WorkflowGraph {
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
}
export interface WorkflowGraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: string; config: Record<string, unknown> };
}
export interface WorkflowGraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}
