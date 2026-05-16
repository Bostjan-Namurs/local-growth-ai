#!/usr/bin/env node

const apiBaseUrl = (process.env.API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
const internalApiToken = process.env.INTERNAL_API_TOKEN;
const timeoutMs = Number(process.env.SMOKE_WORKER_TIMEOUT_MS ?? "15000");
const pollIntervalMs = Number(process.env.SMOKE_WORKER_POLL_INTERVAL_MS ?? "500");

if (!internalApiToken) {
  fail("INTERNAL_API_TOKEN is required.");
}

const startedAt = Date.now();
const enqueueResponse = await requestJson(`${apiBaseUrl}/internal/worker-jobs`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-internal-api-token": internalApiToken
  },
  body: JSON.stringify({
    name: "business_profile_generate",
    llmMode: "fake",
    payload: {
      business_id: `smoke-business-${startedAt}`
    }
  })
});

const agentRunId = enqueueResponse.worker_job?.agentRunId;
if (!agentRunId) {
  fail(`Worker enqueue response did not include agentRunId: ${JSON.stringify(enqueueResponse)}`);
}

process.stdout.write(`Queued worker smoke job ${agentRunId}\n`);

let lastRun;
while (Date.now() - startedAt < timeoutMs) {
  lastRun = await requestJson(`${apiBaseUrl}/agent-runs/${encodeURIComponent(agentRunId)}`, {
    headers: {
      "x-internal-api-token": internalApiToken
    }
  });

  if (lastRun.status === "completed") {
    process.stdout.write(`Worker smoke completed ${agentRunId}\n`);
    process.exit(0);
  }

  if (lastRun.status === "failed") {
    fail(`Worker smoke failed ${agentRunId}: ${lastRun.error ?? "unknown error"}`);
  }

  await sleep(pollIntervalMs);
}

fail(`Timed out waiting for worker smoke completion. Last run: ${JSON.stringify(lastRun)}`);

async function requestJson(url, init = {}) {
  let response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    fail(`Request failed for ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const body = await response.text();
  let parsed;
  try {
    parsed = body ? JSON.parse(body) : {};
  } catch {
    fail(`Response from ${url} was not JSON: ${body}`);
  }

  if (!response.ok) {
    fail(`Request to ${url} returned HTTP ${response.status}: ${JSON.stringify(parsed)}`);
  }

  return parsed;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
