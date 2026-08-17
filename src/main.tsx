import { Buffer } from 'buffer';
import cryptoShim from './lib/cryptoShim';

if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
  (window as any).global = (window as any).global || window;
  (window as any).process = (window as any).process || { env: {}, nextTick: (cb: any) => setTimeout(cb, 0) };

  if (window.crypto) {
    if (!window.crypto.randomUUID) {
      try {
        (window.crypto as any).randomUUID = cryptoShim.randomUUID;
      } catch (e) {}
    }
  } else {
    (window as any).crypto = cryptoShim;
  }
}

if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = (globalThis as any).Buffer || Buffer;
  if ((globalThis as any).crypto) {
    if (!(globalThis as any).crypto.randomUUID) {
      try {
        (globalThis as any).crypto.randomUUID = cryptoShim.randomUUID;
      } catch (e) {}
    }
  } else {
    (globalThis as any).crypto = cryptoShim;
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.setAttribute('data-mounted', 'true');
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

