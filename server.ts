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

  // Determine production mode: either explicit NODE_ENV or presence of built dist/index.html
  const distPath = path.join(process.cwd(), 'dist');
  const indexPath = path.join(distPath, 'index.html');
  const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(indexPath);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Facturador SRI</title></head><body><div id="root">Cargando aplicación...</div></body></html>');
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


