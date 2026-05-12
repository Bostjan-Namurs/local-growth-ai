# Recommended Repository Structure

```text
localgrowth-ai/
  README.md
  AGENTS.md
  .env.example
  docker-compose.dev.yml

  apps/
    api/
      src/
        main.py
        config.py
        db.py
        api/v1/
        services/
        models/
        schemas/
      tests/

    worker/
      src/
        main.py
        jobs/
        workflows/
      tests/

    admin-ui/
      app/
      components/
      lib/
      package.json

  packages/
    agents/
      localgrowth_agents/
        base.py
        context.py
        registry.py
        source_compliance.py
        website_audit.py
        business_profile.py
        blueprint_matcher.py
        proposal.py
        app_spec.py
        content.py
        qa.py
        campaign.py
      tests/

    llm/
      localgrowth_llm/
        client.py
        fake_client.py
        gateway_client.py
        models.py
        usage_logger.py
      tests/

    blueprints/
      restaurant_reservation_plus.md
      salon_booking_plus.md
      loader.py
      schemas/

    app-generator/
      templates/
        restaurant-pwa-v1/
        salon-booking-v1/
      generator.py
      schemas/

    shared/
      localgrowth_shared/
        types.py
        audit.py
        approvals.py
        errors.py

  migrations/
    versions/

  infra/
    k8s/
      api.yaml
      worker.yaml
      admin-ui.yaml
      llm-gateway.yaml
      vllm.yaml
    helm/

  docs/
```

## Dependency direction

```text
apps/api       -> packages/shared, packages/agents, packages/llm
apps/worker    -> packages/shared, packages/agents, packages/llm, packages/app-generator
apps/admin-ui  -> API only
packages/agents -> packages/llm, packages/shared, packages/blueprints
packages/app-generator -> packages/blueprints, packages/shared
```

Frontend must not import backend internals directly.
