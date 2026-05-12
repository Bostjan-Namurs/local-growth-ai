# 07 — Operational Runbooks

## Runbook: add a new local LLM

1. Choose model and task class.
2. Place model on approved storage path or configure download/init process.
3. Deploy vLLM/Ollama service in `ai-runtime`.
4. Create Kubernetes service.
5. Add alias to LLM Gateway config.
6. Restart gateway.
7. Run health test.
8. Run agent contract tests.
9. Update model registry.
10. Enable model alias for selected agents.

## Runbook: rotate LLM gateway key

1. Create new Kubernetes secret value.
2. Rollout restart LLM Gateway.
3. Update backend/worker secret.
4. Rollout restart backend/worker.
5. Confirm test chat completion.
6. Revoke old key.
7. Record change in audit log.

## Runbook: Supabase backup

Daily:

1. Run logical backup of Postgres.
2. Backup Supabase storage bucket/object store.
3. Export critical secrets/config references.
4. Push encrypted backup outside cluster.
5. Verify backup size and checksum.

Monthly:

1. Restore backup into staging.
2. Run schema validation.
3. Run sample app workflow.
4. Document result.

## Runbook: failed agent run

1. Open agent run details.
2. Check input hash and source records.
3. Check model alias and gateway logs.
4. Check schema validation error.
5. If source issue: mark source restricted/rejected.
6. If LLM issue: retry with same prompt version or route to stronger model.
7. If data issue: mark `needs_more_data`.
8. Do not manually edit output without creating a new version.

## Runbook: failed preview build

1. Check generated app config schema.
2. Check template version.
3. Check build logs.
4. Check missing required customer inputs.
5. Re-run ContentAgent/AppSpecAgent only if needed.
6. Rebuild preview.
7. Send to QAAgent.

## Runbook: production deployment rollback

1. Identify last good deployment.
2. Disable new campaign sends for affected app.
3. Roll back app deployment.
4. Confirm health check and public URL.
5. Record incident.
6. Notify customer if needed.
7. Open root-cause ticket.

## Runbook: source compliance incident

1. Stop ingestion from the source.
2. Mark source type as `restricted`.
3. Identify records from source.
4. Disable outreach for affected records.
5. Review allowed retention/deletion requirement.
6. Delete or quarantine records if required.
7. Update SourceComplianceAgent rules.
8. Record incident.

## Runbook: campaign suppression failure

1. Stop sending job.
2. Check suppression list logic.
3. Identify affected recipients.
4. Update suppression state.
5. Review legal obligation for notification/remediation.
6. Add regression test.
7. Record incident.

## Runbook: GPU node unavailable

1. Check GPU node readiness.
2. Check GPU operator pods.
3. Check `nvidia.com/gpu` allocatable resources.
4. Drain/restart node only if safe.
5. Reduce worker concurrency.
6. Route aliases to CPU/dev model if acceptable.
7. Restore GPU service and replay queued jobs.

## Runbook: high LLM latency

1. Check queue depth.
2. Check GPU memory/utilization.
3. Check active model deployments.
4. Reduce max concurrency.
5. Route classifier/extractor to smaller model.
6. Batch embedding jobs.
7. Add additional GPU replica if available.

## Runbook: add a new blueprint

1. Create blueprint Markdown/YAML.
2. Define required inputs.
3. Define generated app config schema.
4. Add template mapping.
5. Add content prompt examples.
6. Add test business fixture.
7. Run blueprint validation.
8. Add embeddings to documents table.
9. Enable for selected vertical.
