import express from 'express';
import path from 'path';
import fs from 'fs';
import expressApp from './src/expressApp';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Root health check endpoint for Cloud Run and proxy deployment verifiers
  app.get(['/health', '/api/health', '/_health'], (req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Mount API router & routes from shared module
  app.use(expressApp);

  // --- Vite & Client static serving ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Resolve static dist folder robustly whether launched from cwd or dist
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist'))
      ? path.join(process.cwd(), 'dist')
      : (typeof __dirname !== 'undefined' && __dirname.endsWith('dist') ? __dirname : path.join(process.cwd(), 'dist'));

    const indexPath = path.join(distPath, 'index.html');

    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<!DOCTYPE html><html><head><title>Facturador SRI</title></head><body><div id="root">Cargando aplicación...</div></body></html>');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SRI APP] Server listening on http://0.0.0.0:${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

startServer().catch((err) => {
  console.error('[FATAL SERVER START ERROR]', err);
  process.exit(1);
});

