import { getSettings } from "./config.js";
import { createApp } from "./app.js";

const settings = getSettings();
const app = createApp();

await app.listen({
  host: settings.apiHost,
  port: settings.apiPort
});
