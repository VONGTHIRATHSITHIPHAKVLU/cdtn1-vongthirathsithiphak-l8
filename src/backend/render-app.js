import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createApp } from './server.js';

// Render adapter only: existing API/auth/business rules remain in createApp.
export function createRenderApp(service, { dist, ...options }) {
  const api = createApp(service, options);
  // Read only built HTML, JS and CSS at startup. URLs never become file paths.
  const files = new Map([['/', { type:'text/html; charset=utf-8', body:readFileSync(join(dist,'index.html')) }]]);
  for (const name of readdirSync(join(dist,'assets'))) {
    if (!/^[a-zA-Z0-9_-]+\.(js|css)$/.test(name)) continue;
    files.set('/assets/'+name, { type:name.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/css; charset=utf-8', body:readFileSync(join(dist,'assets',name)) });
  }
  let windowStart = Date.now(), requests = 0, logins = 0;
  const app = createServer((req,res) => {
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
    res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    res.setHeader('Cache-Control','no-store');
    let path;
    try { path = new URL(req.url,'http://localhost').pathname; }
    catch { res.writeHead(400); res.end(); return; }
    if (path === '/api' || path.startsWith('/api/')) {
      // Global demo bounds, not IP-based: never trust client forwarded headers.
      // Health probes do not consume the budget. Existing account lock still applies.
      if (!(req.method === 'GET' && path === '/api/health')) {
        if (Date.now()-windowStart >= 60000) { windowStart=Date.now(); requests=0; logins=0; }
        requests++;
        if (req.method === 'POST' && path === '/api/auth/login') logins++;
        if (requests > 120 || logins > 12) {
          res.setHeader('Retry-After','60');
          res.writeHead(429,{'Content-Type':'application/json; charset=utf-8'});
          res.end(JSON.stringify({error:'DEMO_RATE_LIMIT',message:'Demo busy. Retry in one minute.',fields:{}}));
          return;
        }
      }
      api.emit('request',req,res); return;
    }
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405,{Allow:'GET, HEAD'}); res.end(); return; }
    const file = files.get(path) || (/^\/survey\/[a-f0-9]{32}$/.test(path) ? files.get('/') : undefined);
    if (!file) { res.writeHead(404); res.end(); return; }
    res.writeHead(200,{'Content-Type':file.type,'Content-Length':file.body.length});
    res.end(req.method === 'HEAD' ? undefined : file.body);
  });
  app.requestTimeout=15000;
  app.headersTimeout=10000;
  return app;
}

export function renderSettings(env) {
  if (env.DEMO_ONLY !== 'true' || typeof env.DEMO_PASSWORD !== 'string' || env.DEMO_PASSWORD.length < 32) {
    throw new Error('Render demo requires DEMO_ONLY and a new random DEMO_PASSWORD of at least 32 characters.');
  }
  if (!/^\d+$/.test(env.PORT || '') || Number(env.PORT) < 1 || Number(env.PORT) > 65535) {
    throw new Error('Render PORT must be an integer between 1 and 65535.');
  }
  return { port:Number(env.PORT), host:'0.0.0.0' };
}
