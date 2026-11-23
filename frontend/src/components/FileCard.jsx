import { useRef, useState } from 'react'
import { Download, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import FileIcon, { kindStyle } from './FileIcon.jsx'
import { downloadUrl } from '../lib/api.js'
import { formatBytes, formatDate, getExtension, thumbnailUrl } from '../lib/format.js'

function ActionButton({ label, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  )
}

export default function FileCard({ file, busy, onPreview, onReplace, onDelete }) {
  const replaceInput = useRef(null)
  const [thumbFailed, setThumbFailed] = useState(false)
  const thumb = thumbFailed ? null : thumbnailUrl(file)
  const { bg, label } = kindStyle(file.kind)
  const extension = getExtension(file.filename).toUpperCase() || label

  const handleReplacePicked = (event) => {
    const picked = event.target.files[0]
    event.target.value = ''
    if (picked) onReplace(file, picked)
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <button
        type="button"
        onClick={() => onPreview(file)}
        aria-label={`Preview ${file.filename}`}
        className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden ${bg}`}
      >
        {thumb ? (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            onError={() => setThumbFailed(true)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <FileIcon kind={file.kind} className="h-14 w-14" />
        )}
        <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-slate-600 shadow-sm">
          {extension}
        </span>

        {busy && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 text-sm font-medium text-slate-700">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            {busy === 'replacing' ? 'Replacing...' : 'Deleting...'}
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate text-sm font-semibold text-slate-900" title={file.filename}>
          {file.filename}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {formatBytes(file.size)} <span aria-hidden="true">&middot;</span> {formatDate(file.createdAt)}
        </p>

        <div className="-mx-2 mt-3 flex items-center justify-end gap-0.5 border-t border-slate-100 pt-2">
          <a
            href={downloadUrl(file.id)}
            download={file.filename}
            title="Download"
            aria-label={`Download ${file.filename}`}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Download className="h-4 w-4" />
          </a>
          <ActionButton label="Replace file" onClick={() => replaceInput.current?.click()} disabled={Boolean(busy)}>
            <RefreshCw className="h-4 w-4" />
          </ActionButton>
          <ActionButton label="Delete file" onClick={() => onDelete(file)} disabled={Boolean(busy)} danger>
            <Trash2 className="h-4 w-4" />
          </ActionButton>
          <input ref={replaceInput} type="file" className="hidden" onChange={handleReplacePicked} />
        </div>
      </div>
    </article>
  )
}
