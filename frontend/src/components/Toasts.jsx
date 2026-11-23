import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export default function Toasts({ toasts, onDismiss }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error'
        const Icon = isError ? AlertCircle : CheckCircle2
        return (
          <div
            key={toast.id}
            role={isError ? 'alert' : 'status'}
            className="animate-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${isError ? 'text-rose-500' : 'text-emerald-500'}`} />
            <p className="flex-1 text-sm text-slate-700">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="rounded p-0.5 text-slate-400 hover:text-slate-600"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
