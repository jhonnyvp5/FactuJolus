import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
  autoReloadCountdown: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private timer: any = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isChunkError: false,
      autoReloadCountdown: 3
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const msg = error?.message || '';
    const isChunkError = 
      msg.includes('dynamically imported module') ||
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('Loading chunk') ||
      msg.includes('is not a valid JavaScript MIME type');

    return {
      hasError: true,
      error,
      isChunkError,
      autoReloadCountdown: isChunkError ? 1 : 3
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Error capturado:', error, errorInfo);
    
    // If it's a chunk/asset error due to a new release/update, reload immediately with cache-busting
    const msg = error?.message || '';
    const isChunkError = 
      msg.includes('dynamically imported module') ||
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('Loading chunk');

    if (isChunkError) {
      const lastReload = sessionStorage.getItem('last_boundary_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 4000) {
        sessionStorage.setItem('last_boundary_reload', String(now));
        setTimeout(() => {
          window.location.replace(window.location.pathname + '?_v=' + Date.now());
        }, 500);
        return;
      }
    }

    // Auto-reload countdown
    this.timer = setInterval(() => {
      this.setState(prev => {
        if (prev.autoReloadCountdown <= 1) {
          clearInterval(this.timer);
          window.location.replace(window.location.pathname + '?_v=' + Date.now());
          return { ...prev, autoReloadCountdown: 0 };
        }
        return { ...prev, autoReloadCountdown: prev.autoReloadCountdown - 1 };
      });
    }, 1000);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  handleManualReload = () => {
    window.location.replace(window.location.pathname + '?_v=' + Date.now());
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-slate-850 p-8 rounded-3xl border border-slate-750 shadow-2xl text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl mx-auto flex items-center justify-center text-indigo-400">
              {this.state.isChunkError ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">
                {this.state.isChunkError ? 'Nueva Versión Disponible' : 'Actualizando la Aplicación'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {this.state.isChunkError
                  ? 'Se ha detectado una nueva actualización en el sistema. Aplicando los cambios más recientes automáticamente...'
                  : 'Ocurrió un ajuste de versión. La página se restablecerá automáticamente en unos segundos.'}
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-indigo-300 font-mono flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Actualizando en {this.state.autoReloadCountdown}s...</span>
            </div>

            <button
              onClick={this.handleManualReload}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Refrescar Ahora
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
