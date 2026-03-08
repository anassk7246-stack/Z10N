import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { usersRelations } from './schema/users.js';
import { workflowsRelations, workflowVersionsRelations } from './schema/workflows.js';
import { triggersRelations } from './schema/triggers.js';
import { credentialsRelations } from './schema/credentials.js';
import { executionsRelations, executionNodeLogsRelations } from './schema/executions.js';
import { users } from './schema/users.js';
import { workflows, workflowVersions } from './schema/workflows.js';
import { triggers } from './schema/triggers.js';
import { credentials } from './schema/credentials.js';
import { executions, executionNodeLogs } from './schema/executions.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('[Z10N DB] DATABASE_URL is not set.');
}

const queryClient = postgres(connectionString, {
  max: 10,
  connect_timeout: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  ssl: connectionString.includes('neon.tech') ? 'require' : false,
  onnotice: () => {},
});

const schema = {
  users, workflows, workflowVersions, triggers, credentials,
  executions, executionNodeLogs,
  usersRelations, workflowsRelations, workflowVersionsRelations,
  triggersRelations, credentialsRelations,
  executionsRelations, executionNodeLogsRelations,
};

export const db = drizzle(queryClient, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export type DrizzleClient = typeof db;
