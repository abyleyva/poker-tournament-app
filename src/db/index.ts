import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL no está definida. Copia .env.example a .env y configura la conexión a tu base de datos Postgres."
  );
}

// Reuse the client across hot reloads / serverless invocations.
const client =
  global.__pgClient ??
  postgres(connectionString, {
    max: process.env.NODE_ENV === "production" ? 1 : 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgClient = client;
}

export const db = drizzle(client, { schema });
