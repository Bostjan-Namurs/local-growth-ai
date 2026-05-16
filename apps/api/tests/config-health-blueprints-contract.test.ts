import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { getSettings } from "../src/config.js";

describe("Sprint 1 Task 2 API contract", () => {
  it("serves config health, version, and blueprint registry endpoints in fake mode", async () => {
    const app = createApp(getSettings({}));

    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toMatchObject({
      status: "ok",
      app_env: "local",
      llm_mode: "fake"
    });
    expect(typeof health.json().database_configured).toBe("boolean");
    expect(typeof health.json().database_local).toBe("boolean");
    expect(["unset", "local", "supabase", "external", "invalid"]).toContain(
      health.json().database_connection_kind
    );
    expect(typeof health.json().supabase_configured).toBe("boolean");
    expect(typeof health.json().supabase_local).toBe("boolean");
    expect(["unset", "local", "supabase", "external", "invalid"]).toContain(
      health.json().supabase_connection_kind
    );

    const version = await app.inject({ method: "GET", url: "/version" });
    expect(version.statusCode).toBe(200);
    expect(version.json()).toEqual({
      app_name: "localgrowth-ai",
      app_version: "0.1.0"
    });

    const registry = await app.inject({ method: "GET", url: "/blueprints" });
    expect(registry.statusCode).toBe(200);
    expect(registry.json().verticals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          vertical_id: "bike_rental"
        })
      ])
    );

    const blueprint = await app.inject({ method: "GET", url: "/blueprints/bike_rental" });
    expect(blueprint.statusCode).toBe(200);
    expect(blueprint.json()).toMatchObject({
      vertical_id: "bike_rental",
      registry: {
        app_pattern: "rental_booking"
      },
      blueprint: {
        id: "bike_rental"
      }
    });

    const missing = await app.inject({ method: "GET", url: "/blueprints/not_real" });
    expect(missing.statusCode).toBe(404);
    expect(missing.json().detail).toContain("Unknown vertical_id");
  });
});
