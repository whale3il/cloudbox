import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Cloud, FolderOpen, RefreshCw, Search, SearchX, X } from 'lucide-react'
import * as api from './lib/api.js'
import { formatBytes, getExtension } from './lib/format.js'
import { useToasts } from './hooks/useToasts.js'
import UploadZone from './components/UploadZone.jsx'
import FileCard from './components/FileCard.jsx'
import PreviewModal from './components/PreviewModal.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import Toasts from './components/Toasts.jsx'

export default function App() {
  const { toasts, toast, dismiss } = useToasts()

  const [config, setConfig] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [uploading, setUploading] = useState(null)
  const [busy, setBusy] = useState({})
  const [previewing, setPreviewing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const latestRequest = useRef(0)

  // ---- loading ----------------------------------------------------------
  const loadFiles = useCallback(async (search, { silent = false } = {}) => {
    const requestId = ++latestRequest.current
    if (!silent) setLoading(true)
    try {
      const data = await api.listFiles(search)
      if (requestId !== latestRequest.current) return // a newer search superseded this one
      setFiles(data.files)
      setError('')
    } catch (err) {
      if (requestId === latestRequest.current) setError(err.message)
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    api.getConfig().then(setConfig).catch(() => {
      // not fatal: the server still validates every upload
    })
  }, [])

  // debounce the search box so we do not hit the API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    loadFiles(query)
  }, [query, loadFiles])

  const setBusyFor = (id, state) =>
    setBusy((current) => {
      const next = { ...current }
      if (state) next[id] = state
      else delete next[id]
      return next
    })

  // ---- actions ----------------------------------------------------------
  const handleUpload = async (selected) => {
    let list = selected

    if (config) {
      const allowed = new Set(config.allowedExtensions)
      const maxBytes = config.maxFileSizeMB * 1024 * 1024
      const skipped = []

      list = selected.filter((file) => {
        if (!allowed.has(getExtension(file.name))) {
          skipped.push(`${file.name} (unsupported type)`)
          return false
        }
        if (file.size > maxBytes) {
          skipped.push(`${file.name} (over ${config.maxFileSizeMB} MB)`)
          return false
        }
        return true
      })

      if (skipped.length > 0) toast.error(`Skipped: ${skipped.join(', ')}`)
    }

    if (list.length === 0) return

    setUploading({ count: list.length, progress: 0 })
    try {
      const result = await api.uploadFiles(list, (progress) =>
        setUploading((current) => (current ? { ...current, progress } : current))
      )
      toast.success(result.message)
      if (result.errors?.length > 0) {
        toast.error(`Could not upload: ${result.errors.map((e) => e.filename).join(', ')}`)
      }
      await loadFiles(query, { silent: true })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(null)
    }
  }

  const handleReplace = async (file, replacement) => {
    if (config && replacement.size > config.maxFileSizeMB * 1024 * 1024) {
      return toast.error(`${replacement.name} is over ${config.maxFileSizeMB} MB`)
    }
    if (config && !config.allowedExtensions.includes(getExtension(replacement.name))) {
      return toast.error(`${replacement.name} has an unsupported file type`)
    }

    setBusyFor(file.id, 'replacing')
    try {
      const result = await api.replaceFile(file.id, replacement)
      setFiles((current) => current.map((item) => (item.id === file.id ? result.file : item)))
      toast.success(`Replaced with ${result.file.filename}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyFor(file.id, null)
    }
  }

  const handleDelete = async (file) => {
    setDeleting(null)
    setBusyFor(file.id, 'deleting')
    try {
      await api.deleteFile(file.id)
      setFiles((current) => current.filter((item) => item.id !== file.id))
      toast.success(`Deleted ${file.filename}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyFor(file.id, null)
    }
  }

  // ---- derived ----------------------------------------------------------
  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files])
  const accept = config ? config.allowedExtensions.map((ext) => `.${ext}`).join(',') : undefined
  const searching = query.length > 0

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Cloud className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">CloudBox</h1>
            <p className="hidden text-xs text-slate-500 sm:block">Simple cloud file storage</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <UploadZone onFiles={handleUpload} uploading={uploading} accept={accept} maxSizeMB={config?.maxFileSizeMB} />

        <section aria-labelledby="files-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="files-heading" className="text-xl font-semibold tracking-tight">
                {searching ? 'Search results' : 'Your files'}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {loading && files.length === 0
                  ? 'Loading...'
                  : `${files.length} ${files.length === 1 ? 'file' : 'files'}${
                      files.length > 0 ? ` - ${formatBytes(totalSize)} total` : ''
                    }`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-72 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search files by name"
                  aria-label="Search files by name"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 [&::-webkit-search-cancel-button]:hidden"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => loadFiles(query)}
                title="Refresh"
                aria-label="Refresh files"
                className="rounded-xl border border-slate-300 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="mt-6">
            {error ? (
              <State
                icon={<AlertCircle className="h-8 w-8 text-rose-500" />}
                title="Could not load your files"
                text={error}
                action={
                  <button
                    type="button"
                    onClick={() => loadFiles(query)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Try again
                  </button>
                }
              />
            ) : loading && files.length === 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
                ))}
              </div>
            ) : files.length === 0 ? (
              searching ? (
                <State
                  icon={<SearchX className="h-8 w-8 text-slate-400" />}
                  title="No files found"
                  text={`Nothing matches "${query}". Try a different name.`}
                />
              ) : (
                <State
                  icon={<FolderOpen className="h-8 w-8 text-slate-400" />}
                  title="No files yet"
                  text="Upload your first file using the box above."
                />
              )
            ) : (
              <div
                className={`grid grid-cols-1 gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                  loading ? 'opacity-60' : ''
                }`}
              >
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    busy={busy[file.id]}
                    onPreview={setPreviewing}
                    onReplace={handleReplace}
                    onDelete={setDeleting}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {previewing && <PreviewModal file={previewing} onClose={() => setPreviewing(null)} />}
      {deleting && <ConfirmDialog file={deleting} onCancel={() => setDeleting(null)} onConfirm={handleDelete} />}
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

function State({ icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">{icon}</span>
      <h3 className="mt-4 text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
