import { getSettings } from "../src/config.js";
import { syncBlueprintCatalog } from "../src/services/blueprints.js";

const rows = await syncBlueprintCatalog(getSettings());

console.log(
  JSON.stringify(
    {
      status: "ok",
      synced_blueprints: rows.map((row) => ({
        id: row.id,
        packageName: row.packageName,
        active: row.active
      }))
    },
    null,
    2
  )
);
