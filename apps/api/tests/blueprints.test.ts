import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import {
  BlueprintError,
  BlueprintRegistry,
  buildBlueprintCatalogRows
} from "../src/services/blueprints.js";

describe("blueprints", () => {
  it("lists bike rental from the API", async () => {
    const app = createApp();
    const response = await app.inject({ method: "GET", url: "/blueprints" });
    const ids = response.json().verticals.map((item: { vertical_id: string }) => item.vertical_id);

    expect(response.statusCode).toBe(200);
    expect(ids).toContain("bike_rental");
  });

  it("loads bike rental blueprint from the API", async () => {
    const app = createApp();
    const response = await app.inject({ method: "GET", url: "/blueprints/bike_rental" });
    const data = response.json();

    expect(response.statusCode).toBe(200);
    expect(data.vertical_id).toBe("bike_rental");
    expect(data.registry.app_pattern).toBe("rental_booking");
    expect(data.blueprint.id).toBe("bike_rental");
  });

  it("returns 404 for unknown blueprints", async () => {
    const app = createApp();
    const response = await app.inject({ method: "GET", url: "/blueprints/not_real" });

    expect(response.statusCode).toBe(404);
  });

  it("loads a custom registry path", () => {
    const root = mkdtempSync(join(tmpdir(), "localgrowth-blueprints-"));
    writeFileSync(join(root, "registry.yaml"), "verticals:\n  test:\n    name: Test\n");

    const registry = new BlueprintRegistry(root);

    expect(registry.listVerticals()[0].vertical_id).toBe("test");
  });

  it("fails clearly when a blueprint file is missing", () => {
    const root = mkdtempSync(join(tmpdir(), "localgrowth-blueprints-"));
    writeFileSync(join(root, "registry.yaml"), "verticals:\n  test:\n    name: Test\n");

    expect(() => new BlueprintRegistry(root).loadBlueprint("test")).toThrow(BlueprintError);
    expect(() => new BlueprintRegistry(root).loadBlueprint("test")).toThrow(
      "Blueprint file for test not found"
    );
  });

  it("fails clearly when the registry is invalid", () => {
    const root = mkdtempSync(join(tmpdir(), "localgrowth-blueprints-"));
    writeFileSync(join(root, "registry.yaml"), "name: Invalid\n");

    expect(() => new BlueprintRegistry(root).loadRegistry()).toThrow("Blueprint registry is invalid");
  });

  it("fails clearly when the blueprint id does not match", () => {
    const root = mkdtempSync(join(tmpdir(), "localgrowth-blueprints-"));
    const dir = join(root, "test");
    mkdirSync(dir);
    writeFileSync(join(root, "registry.yaml"), "verticals:\n  test:\n    name: Test\n");
    writeFileSync(join(dir, "blueprint.yaml"), "id: other\nname: Other\n");

    expect(() => new BlueprintRegistry(root).loadBlueprint("test")).toThrow(
      "must include matching id"
    );
  });

  it("rejects registry blueprint paths outside the blueprint root", () => {
    const root = mkdtempSync(join(tmpdir(), "localgrowth-blueprints-"));
    writeFileSync(
      join(root, "registry.yaml"),
      "verticals:\n  test:\n    name: Test\n    blueprint_path: ../outside.yaml\n"
    );

    expect(() => new BlueprintRegistry(root).blueprintPathFor("test")).toThrow(
      "escapes blueprint root"
    );
  });

  it("builds database catalog rows from the local registry without requiring every blueprint file", () => {
    const rows = buildBlueprintCatalogRows();
    const bikeRental = rows.find((row) => row.id === "bike_rental");
    const restaurant = rows.find((row) => row.id === "restaurant");

    expect(rows.map((row) => row.id)).toEqual(["restaurant", "salon", "bike_rental"]);
    expect(restaurant).toMatchObject({
      id: "restaurant",
      active: true,
      templateRef: "restaurant-pwa"
    });
    expect(bikeRental).toMatchObject({
      id: "bike_rental",
      active: false,
      packageName: "bike_rental_booking_plus",
      templateRef: "rental-booking-pwa"
    });
    expect(bikeRental?.requiredInputs).toContain("business_name");
    expect(bikeRental?.features).toContain("rental_catalog");
  });
});
