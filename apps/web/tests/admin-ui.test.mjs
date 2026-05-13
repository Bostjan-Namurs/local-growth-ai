import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { access } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const appRoot = new URL("../", import.meta.url).pathname;
const srcRoot = join(appRoot, "src");

const requiredRouteFiles = [
  "app/(admin)/dashboard/page.tsx",
  "app/(admin)/leads/page.tsx",
  "app/(admin)/leads/[businessId]/page.tsx",
  "app/(admin)/proposals/page.tsx",
  "app/(admin)/proposals/[proposalId]/page.tsx",
  "app/(admin)/apps/page.tsx",
  "app/(admin)/apps/[appId]/page.tsx",
  "app/(admin)/business-types/page.tsx",
  "app/(admin)/business-types/new/page.tsx",
  "app/(admin)/business-types/[verticalId]/page.tsx",
  "app/(admin)/business-types/[verticalId]/codex-handoff/page.tsx",
  "app/(admin)/agent-runs/page.tsx",
  "app/(admin)/agent-runs/[runId]/page.tsx",
  "app/(admin)/settings/page.tsx",
  "app/(admin)/settings/llm-gateway/page.tsx"
];

test("required admin routes have page modules", async () => {
  for (const routeFile of requiredRouteFiles) {
    const absolutePath = join(srcRoot, routeFile);
    await access(absolutePath);
    const source = readFileSync(absolutePath, "utf8");
    assert.match(source, /export default (async )?function \w+Page\(/, `${routeFile} must export a default page component`);
  }
});

test("admin loading, error, and not-found states exist", async () => {
  for (const stateFile of ["app/(admin)/loading.tsx", "app/(admin)/error.tsx", "app/not-found.tsx"]) {
    await access(join(srcRoot, stateFile));
  }
});

test("admin shell exposes required navigation groups", () => {
  const source = readFileSync(join(srcRoot, "components/layout/admin-shell.tsx"), "utf8");
  for (const label of ["Dashboard", "Pipeline", "Automation", "Configuration", "System"]) {
    assert.match(source, new RegExp(label), `missing sidebar label: ${label}`);
  }
});

test("mock screens label AI and unknown customer facts", () => {
  const source = [
    readFileSync(join(srcRoot, "features/admin/screens.tsx"), "utf8"),
    readFileSync(join(srcRoot, "features/admin/interactive.tsx"), "utf8"),
    readFileSync(join(srcRoot, "components/ui/badges.tsx"), "utf8")
  ].join("\n");
  for (const label of ["AI draft", "Placeholder", "Missing data", "Verified", "Needs review"]) {
    assert.match(source, new RegExp(label), `missing trust label: ${label}`);
  }
});

test("mock UI has client-side filters, wizard navigation, and approval state", () => {
  const source = readFileSync(join(srcRoot, "features/admin/interactive.tsx"), "utf8");
  for (const marker of ["LeadInboxInteractive", "BusinessTypeWizardInteractive", "ProposalApprovalPanel", "useState", "useMemo"]) {
    assert.match(source, new RegExp(marker), `missing interactive marker: ${marker}`);
  }
});

test("admin screens use the read-only data facade instead of mock data directly", () => {
  const screens = readFileSync(join(srcRoot, "features/admin/screens.tsx"), "utf8");
  const interactive = readFileSync(join(srcRoot, "features/admin/interactive.tsx"), "utf8");
  const facade = readFileSync(join(srcRoot, "lib/admin-api.ts"), "utf8");

  assert.doesNotMatch(screens, /mock-data/, "server screens should not import mock data directly");
  assert.doesNotMatch(interactive, /mock-data/, "client widgets should receive data through props");
  assert.match(facade, /async function listLeads/, "facade should expose async read methods");
  assert.match(facade, /from "\.\/mock-data"/, "facade should be the only mock data adapter");
  assert.doesNotMatch(facade, /fetch\(|supabase|LLM|deploy|outreach/i, "facade must not call real services yet");
});

test("dynamic route pages pass params into screen components", () => {
  const dynamicRoutes = new Map([
    ["app/(admin)/leads/[businessId]/page.tsx", "businessId"],
    ["app/(admin)/proposals/[proposalId]/page.tsx", "proposalId"],
    ["app/(admin)/apps/[appId]/page.tsx", "appId"],
    ["app/(admin)/agent-runs/[runId]/page.tsx", "runId"],
    ["app/(admin)/business-types/[verticalId]/page.tsx", "verticalId"],
    ["app/(admin)/business-types/[verticalId]/codex-handoff/page.tsx", "verticalId"]
  ]);

  for (const [routeFile, paramName] of dynamicRoutes) {
    const source = readFileSync(join(srcRoot, routeFile), "utf8");
    assert.match(source, new RegExp(`const \\{ ${paramName} \\} = await params`), `${routeFile} must read ${paramName}`);
    assert.match(source, new RegExp(`${paramName}=\\{${paramName}\\}`), `${routeFile} must pass ${paramName} to the screen`);
  }
});

test("legacy admin routes redirect to canonical routes", () => {
  const redirects = new Map([
    ["app/admin/page.tsx", "/dashboard"],
    ["app/admin/leads/page.tsx", "/leads"],
    ["app/admin/approvals/page.tsx", "/approvals"],
    ["app/admin/verticals/new/page.tsx", "/business-types/new"]
  ]);

  for (const [file, target] of redirects) {
    const source = readFileSync(join(srcRoot, file), "utf8");
    assert.match(source, /redirect\(/, `${file} should redirect`);
    assert.match(source, new RegExp(target.replaceAll("/", "\\/")), `${file} should redirect to ${target}`);
  }
});

test("tables expose captions for accessibility", () => {
  const screens = readFileSync(join(srcRoot, "features/admin/screens.tsx"), "utf8");
  const interactive = readFileSync(join(srcRoot, "features/admin/interactive.tsx"), "utf8");
  const tableCount = (screens.match(/<table className="table">/g) ?? []).length + (interactive.match(/<table className="table">/g) ?? []).length;
  const captionCount = (screens.match(/<caption>/g) ?? []).length + (interactive.match(/<caption>/g) ?? []).length;
  assert.equal(captionCount, tableCount, "each admin table should have a caption");
});

test("dangerous MVP actions are disabled or explicitly blocked", () => {
  const source = readFileSync(join(srcRoot, "features/admin/screens.tsx"), "utf8");
  const dangerousLabels = ["Send outreach disabled", "Deploy production", "Run Codex handoff disabled"];

  for (const label of dangerousLabels) {
    const labelIndex = source.indexOf(label);
    assert.notEqual(labelIndex, -1, `missing dangerous action label: ${label}`);
    const localMarkup = source.slice(Math.max(0, labelIndex - 180), labelIndex + label.length + 80);
    assert.match(localMarkup, /disabled/, `${label} must remain disabled`);
  }
});

test("web package does not inherit Figma export dependencies", () => {
  const packageJson = JSON.parse(readFileSync(join(appRoot, "package.json"), "utf8"));
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  for (const forbiddenDependency of ["@mui/material", "@mui/icons-material", "react-router", "lucide-react", "recharts"]) {
    assert.equal(dependencies[forbiddenDependency], undefined, `${forbiddenDependency} should not be added to apps/web`);
  }
});

test("admin routes render through a temporary Next dev server", async (t) => {
  const port = 3217;
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: appRoot,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  t.after(() => {
    server.kill("SIGTERM");
  });

  let output = "";
  const startup = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Next dev server did not start. Output: ${output}`)), 30000);
    const handleOutput = (chunk) => {
      output += chunk.toString();
      if (output.includes("listen EPERM")) {
        clearTimeout(timeout);
        resolve("sandbox-blocked");
      }
      if (output.includes("Ready")) {
        clearTimeout(timeout);
        resolve("ready");
      }
    };
    server.stdout.on("data", (chunk) => {
      handleOutput(chunk);
    });
    server.stderr.on("data", (chunk) => {
      handleOutput(chunk);
    });
    server.on("exit", (code) => {
      if (code !== null && code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Next dev server exited early with code ${code}. Output: ${output}`));
      }
    });
  });

  if (startup === "sandbox-blocked") {
    t.skip("sandbox blocked local port binding for the temporary route smoke server");
    return;
  }

  for (const route of ["/dashboard", "/leads", "/proposals/proposal-001", "/apps/app-001", "/business-types/new", "/agent-runs/run-001", "/settings/llm-gateway"]) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`, { method: "GET" });
    assert.equal(response.status, 200, `${route} should render`);
    const body = await response.text();
    assert.match(body, /LocalGrowth AI|Dashboard|Lead Inbox|LLM Gateway/, `${route} should return admin HTML`);
  }

  for (const route of ["/leads/not-a-lead", "/proposals/not-a-proposal", "/apps/not-an-app", "/agent-runs/not-a-run", "/business-types/not-a-vertical"]) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`, { method: "GET" });
    assert.ok([200, 404].includes(response.status), `${route} should return a not-found response`);
    const body = await response.text();
    assert.match(body, /Page not found|NEXT_HTTP_ERROR_FALLBACK;404/, `${route} should render not-found content`);
  }
});
