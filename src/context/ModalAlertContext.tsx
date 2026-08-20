import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Mail, 
  FileText, 
  Trash2, 
  Copy, 
  Check, 
  X,
  Send,
  ExternalLink
} from 'lucide-react';

export type ModalAlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface ModalAlertOptions {
  type?: ModalAlertType;
  title?: string;
  message: string;
  detail?: string;
  secuencial?: string;
  email?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

interface ModalAlertContextType {
  showAlert: (options: ModalAlertOptions) => void;
  showSuccess: (title: string, message: string, detail?: string) => void;
  showError: (title: string, message: string, detail?: string) => void;
  showWarning: (title: string, message: string, detail?: string) => void;
  showInfo: (title: string, message: string, detail?: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    isDestructive?: boolean,
    confirmText?: string,
    cancelText?: string
  ) => void;
  closeModal: () => void;
}

const ModalAlertContext = createContext<ModalAlertContextType | null>(null);

// Global bridge for imperative usage when outside React tree
let globalShowAlert: ((options: ModalAlertOptions) => void) | null = null;

export const modalAlert = {
  show: (options: ModalAlertOptions) => globalShowAlert?.(options),
  success: (title: string, message: string, detail?: string) =>
    globalShowAlert?.({ type: 'success', title, message, detail }),
  error: (title: string, message: string, detail?: string) =>
    globalShowAlert?.({ type: 'error', title, message, detail }),
  warning: (title: string, message: string, detail?: string) =>
    globalShowAlert?.({ type: 'warning', title, message, detail }),
  info: (title: string, message: string, detail?: string) =>
    globalShowAlert?.({ type: 'info', title, message, detail }),
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    isDestructive = false,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar'
  ) =>
    globalShowAlert?.({
      type: 'confirm',
      title,
      message,
      onConfirm,
      isDestructive,
      confirmText,
      cancelText,
    }),
};

export const ModalAlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalAlertOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const closeModal = useCallback(() => {
    if (modalState?.onCancel) {
      modalState.onCancel();
    }
    setModalState(null);
    setIsLoading(false);
    setCopiedEmail(false);
  }, [modalState]);

  const showAlert = useCallback((options: ModalAlertOptions) => {
    setModalState(options);
    setIsLoading(false);
    setCopiedEmail(false);
  }, []);

  globalShowAlert = showAlert;

  const showSuccess = useCallback((title: string, message: string, detail?: string) => {
    showAlert({ type: 'success', title, message, detail });
  }, [showAlert]);

  const showError = useCallback((title: string, message: string, detail?: string) => {
    showAlert({ type: 'error', title, message, detail });
  }, [showAlert]);

  const showWarning = useCallback((title: string, message: string, detail?: string) => {
    showAlert({ type: 'warning', title, message, detail });
  }, [showAlert]);

  const showInfo = useCallback((title: string, message: string, detail?: string) => {
    showAlert({ type: 'info', title, message, detail });
  }, [showAlert]);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    isDestructive = false,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar'
  ) => {
    showAlert({
      type: 'confirm',
      title,
      message,
      onConfirm,
      isDestructive,
      confirmText,
      cancelText,
    });
  }, [showAlert]);

  const handleConfirm = async () => {
    if (!modalState) return;
    if (modalState.onConfirm) {
      try {
        setIsLoading(true);
        await modalState.onConfirm();
      } catch (err) {
        console.error('Error in modal confirm handler:', err);
      } finally {
        setIsLoading(false);
        setModalState(null);
      }
    } else {
      setModalState(null);
    }
  };

  const handleCopyEmail = (emailText: string) => {
    navigator.clipboard.writeText(emailText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Helper parser to detect extracted emails, sequentials, or formatted lines
  const parseMessageContent = (rawMessage: string) => {
    if (!rawMessage) return { lines: [], detectedEmail: null, detectedSeq: null };

    // Extract email if present
    const emailMatch = rawMessage.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
    const detectedEmail = emailMatch ? emailMatch[0] : null;

    // Extract sequential (e.g. #000000053 or #53)
    const seqMatch = rawMessage.match(/#(\d+)/);
    const detectedSeq = seqMatch ? seqMatch[1] : null;

    // Clean lines
    const lines = rawMessage
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        // remove leading emojis for cleaner UI rendering
        return l.replace(/^[✅❌⚠️📧💡•\s]+/, '');
      });

    return { lines, detectedEmail, detectedSeq };
  };

  return (
    <ModalAlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        closeModal,
      }}
    >
      {children}

      {/* POP-UP MODAL DIALOG */}
      {modalState && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && modalState.type !== 'confirm') {
              closeModal();
            }
          }}
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-150 dark:border-zinc-800 overflow-hidden transform transition-all animate-scale-up">
            
            {/* Top Accent Bar */}
            <div className={`h-1.5 w-full ${
              modalState.type === 'success'
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
                : modalState.type === 'error' || (modalState.type === 'confirm' && modalState.isDestructive)
                ? 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600'
                : modalState.type === 'warning'
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
                : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600'
            }`} />

            {/* Close Button Top Right */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 space-y-5">
              
              {/* Icon & Title Header */}
              <div className="flex items-start gap-4">
                <div className={`p-3.5 rounded-2xl shrink-0 ${
                  modalState.type === 'success'
                    ? 'bg-emerald-100/80 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 ring-8 ring-emerald-50 dark:ring-emerald-950/20'
                    : modalState.type === 'error' || (modalState.type === 'confirm' && modalState.isDestructive)
                    ? 'bg-rose-100/80 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 ring-8 ring-rose-50 dark:ring-rose-950/20'
                    : modalState.type === 'warning'
                    ? 'bg-amber-100/80 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 ring-8 ring-amber-50 dark:ring-amber-950/20'
                    : 'bg-indigo-100/80 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 ring-8 ring-indigo-50 dark:ring-indigo-950/20'
                }`}>
                  {modalState.type === 'success' && <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />}
                  {modalState.type === 'error' && <XCircle className="w-7 h-7 stroke-[2.2]" />}
                  {modalState.type === 'warning' && <AlertTriangle className="w-7 h-7 stroke-[2.2]" />}
                  {modalState.type === 'info' && <Info className="w-7 h-7 stroke-[2.2]" />}
                  {modalState.type === 'confirm' && (
                    modalState.isDestructive ? <Trash2 className="w-7 h-7 stroke-[2.2]" /> : <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
                  )}
                </div>

                <div className="flex-1 pt-0.5 pr-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
                    {modalState.title || (
                      modalState.type === 'success' ? '¡Operación Exitosa!' :
                      modalState.type === 'error' ? 'Atención / Error' :
                      modalState.type === 'warning' ? 'Advertencia' :
                      modalState.type === 'confirm' ? 'Confirmación requerida' :
                      'Información'
                    )}
                  </h3>
                  
                  {modalState.secuencial && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                      <FileText className="w-3 h-3" />
                      Comprobante #{modalState.secuencial}
                    </span>
                  )}
                </div>
              </div>

              {/* Message Body Content */}
              {(() => {
                const { lines, detectedEmail } = parseMessageContent(modalState.message);
                const activeEmail = modalState.email || detectedEmail;

                return (
                  <div className="space-y-3.5">
                    {/* Main parsed message */}
                    <div className="text-sm text-gray-700 dark:text-zinc-300 space-y-2 leading-relaxed">
                      {lines.map((line, idx) => (
                        <p key={idx} className={idx === 0 ? "font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-[15px]" : "text-gray-600 dark:text-zinc-400 text-xs md:text-sm"}>
                          {line}
                        </p>
                      ))}
                    </div>

                    {/* Email dispatched badge if present */}
                    {activeEmail && (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/60">
                        <div className="flex items-center gap-2.5 text-xs text-indigo-900 dark:text-indigo-200 font-medium">
                          <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="truncate">Notificado a: <strong className="font-semibold text-indigo-950 dark:text-indigo-100">{activeEmail}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(activeEmail)}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer flex items-center gap-1 bg-white dark:bg-zinc-850 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-2xs transition"
                          title="Copiar correo"
                        >
                          {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedEmail ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                    )}

                    {/* Optional extra detail container */}
                    {modalState.detail && (
                      <div className="p-3 bg-gray-50 dark:bg-zinc-800/80 rounded-xl border border-gray-200 dark:border-zinc-700/80 text-xs font-mono text-gray-700 dark:text-zinc-300 max-h-32 overflow-y-auto leading-relaxed">
                        {modalState.detail}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
                {/* Cancel button if confirm modal */}
                {modalState.type === 'confirm' && (
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-gray-200 dark:border-zinc-700 transition cursor-pointer disabled:opacity-50"
                  >
                    {modalState.cancelText || 'Cancelar'}
                  </button>
                )}

                {/* Custom Action Button if provided */}
                {modalState.actionButton && (
                  <button
                    type="button"
                    onClick={() => {
                      modalState.actionButton?.onClick();
                      closeModal();
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                  >
                    {modalState.actionButton.label}
                  </button>
                )}

                {/* Main Accept / Confirm Button */}
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  autoFocus
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold text-white shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 ${
                    modalState.type === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/20 shadow-emerald-600/20'
                      : modalState.type === 'error' || (modalState.type === 'confirm' && modalState.isDestructive)
                      ? 'bg-rose-600 hover:bg-rose-700 focus:ring-4 focus:ring-rose-500/20 shadow-rose-600/20'
                      : modalState.type === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-700 focus:ring-4 focus:ring-amber-500/20 shadow-amber-600/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 shadow-indigo-600/20'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <span>{modalState.confirmText || (modalState.type === 'confirm' ? 'Confirmar' : 'Aceptar')}</span>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </ModalAlertContext.Provider>
  );
};

export const useModalAlert = (): ModalAlertContextType => {
  const context = useContext(ModalAlertContext);
  if (!context) {
    throw new Error('useModalAlert must be used within a ModalAlertProvider');
  }
  return context;
};
