import { useEffect, useState } from 'react'
import { Download, Loader2, X } from 'lucide-react'
import FileIcon from './FileIcon.jsx'
import { downloadUrl, fetchText, previewUrl } from '../lib/api.js'
import { formatBytes, formatDate } from '../lib/format.js'

const MAX_TEXT_CHARS = 100_000

function TextPreview({ file }) {
  const [state, setState] = useState({ loading: true, text: '', error: '' })

  useEffect(() => {
    const controller = new AbortController()
    fetchText(file.id, controller.signal)
      .then((text) => setState({ loading: false, text, error: '' }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ loading: false, text: '', error: err.message })
      })
    return () => controller.abort()
  }, [file.id])

  if (state.loading) return <Centered><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></Centered>
  if (state.error) return <Centered><p className="text-sm text-rose-600">{state.error}</p></Centered>

  const truncated = state.text.length > MAX_TEXT_CHARS
  return (
    <pre className="h-full w-full overflow-auto whitespace-pre-wrap break-words bg-white p-5 font-mono text-xs leading-relaxed text-slate-800">
      {truncated ? state.text.slice(0, MAX_TEXT_CHARS) : state.text}
      {truncated && '\n\n... (preview truncated, download the file to see everything)'}
    </pre>
  )
}

function Centered({ children }) {
  return <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">{children}</div>
}

function Preview({ file }) {
  switch (file.kind) {
    case 'image':
      return (
        <div className="flex h-full w-full items-center justify-center p-4">
          <img src={file.url} alt={file.filename} className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )
    case 'video':
      return (
        <div className="flex h-full w-full items-center justify-center bg-black">
          <video src={file.url} controls autoPlay={false} className="max-h-full max-w-full" />
        </div>
      )
    case 'pdf':
      return <iframe src={previewUrl(file.id)} title={file.filename} className="h-full w-full border-0 bg-white" />
    case 'text':
      return <TextPreview file={file} />
    default:
      return (
        <Centered>
          <FileIcon kind={file.kind} className="h-16 w-16" />
          <p className="font-medium text-slate-800">No preview available for this file type</p>
          <p className="text-sm text-slate-500">You can still download it to open it on your computer.</p>
        </Centered>
      )
  }
}

export default function PreviewModal({ file, onClose }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Preview of ${file.filename}`}
        className="animate-pop flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-slate-900" title={file.filename}>{file.filename}</h2>
            <p className="text-xs text-slate-500">
              {formatBytes(file.size)} <span aria-hidden="true">&middot;</span> Uploaded {formatDate(file.createdAt)}
            </p>
          </div>
          <a
            href={downloadUrl(file.id)}
            download={file.filename}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close preview"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 bg-slate-100">
          <Preview file={file} />
        </div>
      </div>
    </div>
  )
}
