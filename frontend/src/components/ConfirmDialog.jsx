import { useEffect } from 'react'
import { Trash2 } from 'lucide-react'

export default function ConfirmDialog({ file, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="animate-pop w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <Trash2 className="h-5 w-5" />
        </span>
        <h2 id="confirm-title" className="mt-4 text-lg font-semibold text-slate-900">
          Delete this file?
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          <span className="break-all font-medium">{file.filename}</span> will be permanently removed from the cloud
          and both databases. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(file)}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
