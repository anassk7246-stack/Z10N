export { db, type DrizzleClient } from './client.js';

export { users, usersRelations } from './schema/users.js';
export { workflows, workflowVersions, workflowsRelations, workflowVersionsRelations } from './schema/workflows.js';
export { triggers, triggersRelations } from './schema/triggers.js';
export { credentials, credentialsRelations } from './schema/credentials.js';
export { executions, executionNodeLogs, executionsRelations, executionNodeLogsRelations } from './schema/executions.js';

export type { User, NewUser, UserPublic } from './schema/users.js';
export type { Workflow, NewWorkflow, WorkflowVersion, NewWorkflowVersion, WorkflowGraph, WorkflowGraphNode, WorkflowGraphEdge } from './schema/workflows.js';
export type { Trigger, NewTrigger, TriggerType, TriggerConfig, WebhookTrigger, ManualTrigger, WebhookTriggerConfig, ManualTriggerConfig, CronTriggerConfig, WebhookMethod } from './schema/triggers.js';
export type { Credential, NewCredential, CredentialPublic, CredentialPlaintext, CredentialService } from './schema/credentials.js';
export type { Execution, NewExecution, ExecutionNodeLog, NewExecutionNodeLog, ExecutionWithLogs, ExecutionStatus, NodeLogStatus, TriggerSource } from './schema/executions.js';

export {
  eq, ne, gt, gte, lt, lte,
  isNull, isNotNull, inArray, notInArray,
  between, like, ilike,
  and, or, not,
  asc, desc,
  count, sum, avg, min, max,
  sql,
} from 'drizzle-orm';
