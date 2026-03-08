import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { workflows, workflowVersions } from './workflows.js';

export type ExecutionStatus = 'running' | 'success' | 'error' | 'cancelled';
export type NodeLogStatus   = 'pending' | 'running' | 'success' | 'error' | 'skipped';
export type TriggerSource   = 'webhook' | 'manual' | 'cron';

export const executions = pgTable(
  'executions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    workflowId: uuid('workflow_id')
      .references(() => workflows.id, { onDelete: 'set null' }),
    workflowVersionId: uuid('workflow_version_id')
      .references(() => workflowVersions.id, { onDelete: 'set null' }),
    triggerSource: text('trigger_source').$type<TriggerSource>().notNull(),
    triggerPayload: jsonb('trigger_payload'),
    status: text('status')
      .$type<ExecutionStatus>()
      .notNull()
      .default('running'),
    startedAt:    timestamp('started_at',  { withTimezone: true }).notNull().defaultNow(),
    finishedAt:   timestamp('finished_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    finalOutput:  jsonb('final_output'),
  },
  (table) => ({
    workflowIdIdx: index('executions_workflow_id_idx').on(table.workflowId),
    statusIdx:     index('executions_status_idx').on(table.status),
    startedAtIdx:  index('executions_started_at_idx').on(table.startedAt),
  }),
);

export const executionNodeLogs = pgTable(
  'execution_node_logs',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    executionId: uuid('execution_id')
      .notNull()
      .references(() => executions.id, { onDelete: 'cascade' }),
    nodeId:        text('node_id').notNull(),
    nodeType:      text('node_type').notNull(),
    nodeLabel:     text('node_label'),
    status:        text('status').$type<NodeLogStatus>().notNull().default('pending'),
    attemptNumber: text('attempt_number').notNull().default('1'),
    inputData:     jsonb('input_data'),
    outputData:    jsonb('output_data'),
    errorCode:     text('error_code'),
    errorMessage:  text('error_message'),
    startedAt:     timestamp('started_at',  { withTimezone: true }),
    finishedAt:    timestamp('finished_at', { withTimezone: true }),
  },
  (table) => ({
    executionIdIdx: index('exec_node_logs_execution_id_idx').on(table.executionId),
    nodeIdIdx:      index('exec_node_logs_node_id_idx').on(table.nodeId),
    statusIdx:      index('exec_node_logs_status_idx').on(table.status),
  }),
);

export const executionsRelations = relations(executions, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [executions.workflowId],
    references: [workflows.id],
  }),
  workflowVersion: one(workflowVersions, {
    fields: [executions.workflowVersionId],
    references: [workflowVersions.id],
  }),
  nodeLogs: many(executionNodeLogs),
}));

export const executionNodeLogsRelations = relations(executionNodeLogs, ({ one }) => ({
  execution: one(executions, {
    fields: [executionNodeLogs.executionId],
    references: [executions.id],
  }),
}));

export type Execution           = typeof executions.$inferSelect;
export type NewExecution        = typeof executions.$inferInsert;
export type ExecutionNodeLog    = typeof executionNodeLogs.$inferSelect;
export type NewExecutionNodeLog = typeof executionNodeLogs.$inferInsert;
export type ExecutionWithLogs   = Execution & { nodeLogs: ExecutionNodeLog[] };
