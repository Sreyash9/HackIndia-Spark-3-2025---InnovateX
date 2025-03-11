import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon database if running in Replit
if (process.env.REPL_ID) {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set in your environment variables. Check .env.example for the format.",
  );
}

// Pool configuration with SSL settings for local development
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? 
    { rejectUnauthorized: true } : 
    process.env.REPL_ID ? 
      { rejectUnauthorized: true } : 
      false
};

export const pool = new Pool(poolConfig);
export const db = drizzle({ client: pool, schema });

// Log database connection status
pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});