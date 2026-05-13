import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import { type Settings, repoRoot } from "../config.js";
import { createDbForSqlClient, createSqlClient } from "../db/index.js";
import { blueprints as blueprintsTable } from "../db/schema.js";

export class BlueprintError extends Error {}

const registryEntrySchema = z.object({
  name: z.string().min(1),
  status: z.string().optional(),
  app_pattern: z.string().optional(),
  template_id: z.string().optional(),
  default_package: z.string().optional(),
  blueprint_path: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  reusable_for: z.array(z.string()).optional()
});

const registrySchema = z.object({
  verticals: z.record(registryEntrySchema)
});

export type BlueprintRegistryEntry = z.infer<typeof registryEntrySchema>;

export interface BlueprintSummary extends BlueprintRegistryEntry {
  vertical_id: string;
}

export interface BlueprintDetail {
  vertical_id: string;
  registry: BlueprintRegistryEntry;
  blueprint: Record<string, unknown>;
}

export interface BlueprintCatalogRow {
  id: string;
  vertical: string;
  packageName: string;
  version: string;
  title: string;
  description?: string;
  requiredInputs: unknown[];
  features: unknown[];
  schemaJson: Record<string, unknown>;
  templateRef?: string;
  active: boolean;
}

export class BlueprintRegistry {
  constructor(private readonly root = resolve(repoRoot, "blueprints")) {}

  loadRegistry(): z.infer<typeof registrySchema> {
    const raw = this.loadYamlMapping(resolve(this.root, "registry.yaml"), "Blueprint registry");
    const parsed = registrySchema.safeParse(raw);
    if (!parsed.success) {
      throw new BlueprintError(`Blueprint registry is invalid: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  listVerticals(): BlueprintSummary[] {
    const registry = this.loadRegistry();
    return Object.entries(registry.verticals).map(([verticalId, entry]) => ({
      vertical_id: verticalId,
      ...entry
    }));
  }

  getVertical(verticalId: string): BlueprintRegistryEntry {
    const vertical = this.loadRegistry().verticals[verticalId];
    if (!vertical) {
      throw new BlueprintError(`Unknown vertical_id: ${verticalId}`);
    }
    return vertical;
  }

  blueprintPathFor(verticalId: string): string {
    const vertical = this.getVertical(verticalId);
    const path = vertical.blueprint_path
      ? resolve(this.root, vertical.blueprint_path)
      : resolve(this.root, verticalId.replaceAll("_", "-"), "blueprint.yaml");
    if (!isWithinRoot(this.root, path)) {
      throw new BlueprintError(`Blueprint path for ${verticalId} escapes blueprint root: ${path}`);
    }
    return path;
  }

  loadBlueprint(verticalId: string): BlueprintDetail {
    const registry = this.getVertical(verticalId);
    const path = this.blueprintPathFor(verticalId);
    const blueprint = this.loadYamlMapping(path, `Blueprint file for ${verticalId}`);
    if (blueprint.id !== verticalId) {
      throw new BlueprintError(`Blueprint file for ${verticalId} must include matching id: ${path}`);
    }
    return {
      vertical_id: verticalId,
      registry,
      blueprint
    };
  }

  private loadYamlMapping(path: string, description: string): Record<string, unknown> {
    if (!existsSync(path)) {
      throw new BlueprintError(`${description} not found: ${path}`);
    }
    const data = parse(readFileSync(path, "utf8")) ?? {};
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new BlueprintError(`${description} must be a mapping: ${path}`);
    }
    return data as Record<string, unknown>;
  }
}

export function buildBlueprintCatalogRows(registry = new BlueprintRegistry()): BlueprintCatalogRow[] {
  return registry.listVerticals().map((summary) => {
    const detail = loadOptionalBlueprint(registry, summary.vertical_id);
    const blueprint = detail?.blueprint ?? {};

    return {
      id: summary.vertical_id,
      vertical: summary.vertical_id,
      packageName:
        summary.default_package ??
        nestedString(blueprint, ["recommended_solution", "package_id"]) ??
        `${summary.vertical_id}_package`,
      version: stringValue(blueprint.version) ?? "1.0.0",
      title: stringValue(blueprint.name) ?? summary.name,
      description: nestedString(blueprint, ["business_problem", "summary"]) ?? undefined,
      requiredInputs: nestedStringArray(blueprint, ["data_requirements", "required"]),
      features: nestedStringArray(blueprint, ["features", "required"]),
      schemaJson: blueprint,
      templateRef:
        summary.template_id ?? nestedString(blueprint, ["vertical", "default_template"]) ?? undefined,
      active: summary.status === "active"
    };
  });
}

export async function syncBlueprintCatalog(settings: Settings): Promise<BlueprintCatalogRow[]> {
  const sql = createSqlClient(settings);
  const db = createDbForSqlClient(sql);
  const rows = buildBlueprintCatalogRows();

  try {
    for (const row of rows) {
      await db
        .insert(blueprintsTable)
        .values(row)
        .onConflictDoUpdate({
          target: blueprintsTable.id,
          set: {
            vertical: row.vertical,
            packageName: row.packageName,
            version: row.version,
            title: row.title,
            description: row.description,
            requiredInputs: row.requiredInputs,
            features: row.features,
            schemaJson: row.schemaJson,
            templateRef: row.templateRef,
            active: row.active
          }
        });
    }
  } finally {
    await sql.end();
  }

  return rows;
}

function loadOptionalBlueprint(registry: BlueprintRegistry, verticalId: string): BlueprintDetail | undefined {
  try {
    return registry.loadBlueprint(verticalId);
  } catch (error) {
    if (error instanceof BlueprintError && error.message.includes("not found")) {
      return undefined;
    }
    throw error;
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function nestedValue(value: Record<string, unknown>, path: string[]): unknown {
  return path.reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function nestedString(value: Record<string, unknown>, path: string[]): string | undefined {
  return stringValue(nestedValue(value, path));
}

function nestedStringArray(value: Record<string, unknown>, path: string[]): string[] {
  const nested = nestedValue(value, path);
  return Array.isArray(nested) ? nested.filter((item): item is string => typeof item === "string") : [];
}

function isWithinRoot(root: string, path: string): boolean {
  const relativePath = relative(resolve(root), path);
  return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath));
}
