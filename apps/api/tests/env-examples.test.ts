import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { repoRoot } from "../src/config.js";

const envExamplePaths = [".env.example", "examples/dev/.env.example"];

describe("environment examples", () => {
  it("keep committed defaults local, fake, and credential-free", () => {
    for (const relativePath of envExamplePaths) {
      const contents = readFileSync(resolve(repoRoot, relativePath), "utf8");

      expect(contents).toContain("LLM_MODE=fake");
      expect(contents).toContain("DATABASE_URL=postgresql://postgres:postgres@localhost:5432");
      expect(contents).toContain("SUPABASE_URL=http://localhost:54321");
      expect(contents).not.toContain(".supabase.co");
      expect(contents).not.toContain("db.");
    }
  });
});
