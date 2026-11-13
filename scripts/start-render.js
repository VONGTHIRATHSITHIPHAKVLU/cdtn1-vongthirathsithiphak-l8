import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSettings, createRenderApp } from '../src/backend/render-app.js';
import { openDatabase } from '../src/backend/repositories/database.js';
import { SurveyRepository } from '../src/backend/repositories/survey.repository.js';
import { SurveyService } from '../src/backend/services/survey.service.js';
import { logger } from '../src/backend/logger.js';

// Validate before creating any database. Never load .env or a captured credential.
const { port, host } = renderSettings(process.env);
// Dedicated ephemeral path; never open a local/Compose database via DB_PATH.
process.env.DB_PATH = fileURLToPath(new URL('../data/render-demo.sqlite',import.meta.url));
await import('./seed.js'); // Idempotent migration + synthetic demo seed, no reset/delete.
const db = openDatabase();
// Make demo contact destinations explicitly non-deliverable in this dedicated DB.
db.exec("UPDATE customer SET email='demo' || customer_id || '@example.invalid', phone=NULL");
const app = createRenderApp(new SurveyService(new SurveyRepository(db)), {
  dist:resolve(fileURLToPath(new URL('../dist',import.meta.url))),
});
app.listen(port,host,()=>logger('info','Render demo started',{port}));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{
  app.close(()=>{db.close();process.exit(0);});
  setTimeout(()=>process.exit(1),10000).unref();
});
