import {
  databaseConfigured,
  databaseConnectionKind,
  databaseIsLocal,
  repoRoot,
  redactConnectionUrl,
  type ConnectionKind,
  type Settings
} from "../config.js";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { getTableName } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { schema } from "./schema.js";

export { schema };

export interface DatabaseConfig {
  configured: boolean;
  connectionKind: ConnectionKind;
  local: boolean;
  url?: string;
  redactedUrl?: string;
}

export type DatabaseHealth =
  | {
      status: "skipped";
      configured: false;
      connectionKind: "unset";
      local: false;
    }
  | {
      status: "error";
      configured: true;
      connectionKind: ConnectionKind;
      local: boolean;
      redactedUrl?: string;
      error: string;
      readiness?: DatabaseReadiness;
    }
  | {
      status: "ok";
      configured: true;
      connectionKind: ConnectionKind;
      local: boolean;
      redactedUrl?: string;
      readiness: DatabaseReadiness;
    };

export interface DatabaseReadiness {
  migrations: {
    status: "ok" | "error";
    appliedCount: number;
    expectedCount: number;
    latestApplied?: string;
    latestExpected?: string;
    missing: string[];
    extra: string[];
  };
  rls: {
    status: "ok" | "error";
    checkedTables: string[];
    enabledTables: string[];
    missingTables: string[];
    disabledTables: string[];
  };
}

export function getDatabaseConfig(settings: Settings): DatabaseConfig {
  const connectionKind = databaseConnectionKind(settings);

  if (!databaseConfigured(settings)) {
    return {
      configured: false,
      connectionKind,
      local: false
    };
  }

  const redactedUrl = redactConnectionUrl(settings.databaseUrl);

  return {
    configured: true,
    connectionKind,
    local: databaseIsLocal(settings),
    ...(redactedUrl ? { url: settings.databaseUrl, redactedUrl } : {})
  };
}

export function createSqlClient(settings: Settings) {
  const config = getDatabaseConfig(settings);
  if (!config.configured || !config.url) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (config.connectionKind === "invalid") {
    throw new Error("DATABASE_URL is invalid");
  }

  return postgres(config.url, {
    max: 5,
    connect_timeout: 10,
    idle_timeout: 20,
    ssl: config.local ? undefined : "require"
  });
}

export function createDbForSqlClient(sql: ReturnType<typeof createSqlClient>) {
  return drizzle(sql, { schema });
}

export function createDb(settings: Settings) {
  return createDbForSqlClient(createSqlClient(settings));
}

export async function checkDatabaseConnection(settings: Settings): Promise<DatabaseHealth> {
  const config = getDatabaseConfig(settings);

  if (!config.configured) {
    return {
      status: "skipped",
      configured: false,
      connectionKind: "unset",
      local: false
    };
  }

  if (config.connectionKind === "invalid") {
    return {
      status: "error",
      configured: true,
      connectionKind: config.connectionKind,
      local: config.local,
      error: "DATABASE_URL is invalid"
    };
  }

  const client = createSqlClient(settings);
  try {
    await client`select 1 as ok`;
    const readiness = await checkDatabaseReadiness(client);
    if (readiness.migrations.status !== "ok" || readiness.rls.status !== "ok") {
      return {
        status: "error",
        configured: true,
        connectionKind: config.connectionKind,
        local: config.local,
        ...(config.redactedUrl ? { redactedUrl: config.redactedUrl } : {}),
        error: "Database readiness check failed",
        readiness
      };
    }

    return {
      status: "ok",
      configured: true,
      connectionKind: config.connectionKind,
      local: config.local,
      ...(config.redactedUrl ? { redactedUrl: config.redactedUrl } : {}),
      readiness
    };
  } catch (error) {
    return {
      status: "error",
      configured: true,
      connectionKind: config.connectionKind,
      local: config.local,
      ...(config.redactedUrl ? { redactedUrl: config.redactedUrl } : {}),
      error: error instanceof Error ? error.message : "Unknown database connection error"
    };
  } finally {
    await client.end();
  }
}

export function expectedMigrationVersions(): string[] {
  const migrationsDir = resolve(repoRoot, "migrations/drizzle");
  if (!existsSync(migrationsDir)) return [];
  return readdirSync(migrationsDir)
    .filter((filename) => filename.endsWith(".sql"))
    .sort()
    .map((filename) => filename.replace(/\.sql$/, ""));
}

export function publicAppTableNames(): string[] {
  return Object.values(schema)
    .map((table) => getTableName(table))
    .sort();
}

async function checkDatabaseReadiness(
  client: ReturnType<typeof createSqlClient>
): Promise<DatabaseReadiness> {
  const expectedMigrations = expectedMigrationVersions();
  const migrationRows = await client<{ version: string }[]>`
    select version
    from localgrowth_internal.schema_migrations
    order by version
  `;
  const appliedMigrations = migrationRows.map((row) => row.version);
  const missingMigrations = expectedMigrations.filter((version) => !appliedMigrations.includes(version));
  const extraMigrations = appliedMigrations.filter((version) => !expectedMigrations.includes(version));

  const tableNames = publicAppTableNames();
  const rlsRows = await client<{ relname: string; relrowsecurity: boolean }[]>`
    select c.relname, c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname = any(${tableNames})
    order by c.relname
  `;
  const foundTables = rlsRows.map((row) => row.relname);
  const enabledTables = rlsRows.filter((row) => row.relrowsecurity).map((row) => row.relname);
  const missingTables = tableNames.filter((tableName) => !foundTables.includes(tableName));
  const disabledTables = rlsRows
    .filter((row) => !row.relrowsecurity)
    .map((row) => row.relname);

  return {
    migrations: {
      status: missingMigrations.length === 0 && extraMigrations.length === 0 ? "ok" : "error",
      appliedCount: appliedMigrations.length,
      expectedCount: expectedMigrations.length,
      latestApplied: appliedMigrations.at(-1),
      latestExpected: expectedMigrations.at(-1),
      missing: missingMigrations,
      extra: extraMigrations
    },
    rls: {
      status: missingTables.length === 0 && disabledTables.length === 0 ? "ok" : "error",
      checkedTables: tableNames,
      enabledTables,
      missingTables,
      disabledTables
    }
  };
}
