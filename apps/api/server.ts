import 'dotenv/config';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import rateLimit from '@fastify/rate-limit';
import { db } from '@z10n/database';
import { sql } from 'drizzle-orm';

// --- CONFIGURATION ---
const MY_DATABASE_URL = "postgresql://neondb_owner:npg_TC7NOV5Liwcn@ep-rapid-pond-a1ltv2bg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const MY_JWT_SECRET = "z10n_master_99_key_secret_7721_random";
const MY_ENC_KEY = "5f4dcc3b5aa765d61d8327deb882cf990123456789abcdef0123456789abcdef";
// ---------------------

function validateEnv(): void {
  if (!MY_DATABASE_URL || MY_DATABASE_URL === "postgresql://neondb_owner:npg_TC7NOV5Liwcn@ep-rapid-pond-a1ltv2bg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  ") {
    process.exit(1);
  }
  if (!/^[0-9a-fA-F]{64}$/.test(MY_ENC_KEY)) {
    process.exit(1);
  }
}

export async function buildServer(): Promise<FastifyInstance> {
  const isDev = process.env.NODE_ENV !== 'production';

  const server = Fastify({
    logger: isDev,
    genReqId: () => crypto.randomUUID(),
  });

  await server.register(cors, {
    origin: true,
    credentials: true,
  });

  await server.register(rateLimit, {
    global: true, 
    max: 100, 
    timeWindow: '1 minute'
  });

  await server.register(jwt, {
    secret: MY_JWT_SECRET,
    sign: { expiresIn: '7d' },
  });

  await server.register(websocket);

  server.decorate('db', db);
  server.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  server.get('/health', async (_request, reply) => {
    try {
      await db.execute(sql`SELECT 1`);
      return reply.code(200).send({ status: 'ok' });
    } catch (err) {
      return reply.code(503).send({ status: 'error' });
    }
  });

  const { authRoutes }       = await import('./routes/auth.js');
  const { workflowRoutes }   = await import('./routes/workflows.js');
  const { credentialRoutes } = await import('./routes/credentials.js');
  const { executionRoutes }  = await import('./routes/executions.js');
  const { nodeRoutes }       = await import('./routes/nodes.js');
  const { webhookRoutes }    = await import('./routes/webhook.js');

  await server.register(authRoutes,       { prefix: '/api/auth' });
  await server.register(workflowRoutes,   { prefix: '/api/workflows' });
  await server.register(credentialRoutes, { prefix: '/api/credentials' });
  await server.register(executionRoutes,  { prefix: '/api/executions' });
  await server.register(nodeRoutes,       { prefix: '/api/nodes' });
  await server.register(webhookRoutes,    { prefix: '/webhook' });

  return server;
}

async function main(): Promise<void> {
  validateEnv();
  const server = await buildServer();
  try {
    await server.listen({ host: '0.0.0.0', port: 3001 });
  } catch (err) {
    process.exit(1);
  }
}

main();
