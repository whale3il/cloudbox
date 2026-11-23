import { useRef, useState } from 'react'
import { CloudUpload, Loader2 } from 'lucide-react'

export default function UploadZone({ onFiles, uploading, accept, maxSizeMB }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const disabled = Boolean(uploading)

  const openPicker = () => !disabled && inputRef.current?.click()

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    if (!disabled) onFiles(Array.from(event.dataTransfer.files))
  }

  const handleChange = (event) => {
    // copy first: resetting the input empties the live FileList
    const files = Array.from(event.target.files)
    event.target.value = ''
    if (files.length > 0) onFiles(files)
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Upload files"
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openPicker()
        }
      }}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        dragging
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/40'
      } ${disabled ? 'cursor-wait' : 'cursor-pointer'}`}
    >
      <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={handleChange} />

      {uploading ? (
        <div className="w-full max-w-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-500" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            {uploading.progress < 100
              ? `Uploading ${uploading.count} ${uploading.count === 1 ? 'file' : 'files'}... ${uploading.progress}%`
              : 'Saving to the cloud...'}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-200"
              style={{ width: `${uploading.progress}%` }}
            />
          </div>
        </div>
      ) : (
        <>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <CloudUpload className="h-7 w-7" />
          </span>
          <p className="mt-4 text-base font-semibold text-slate-800">
            Drag and drop files here, or <span className="text-indigo-600">browse</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Images, videos, PDFs, text and Office files
            {maxSizeMB ? ` - up to ${maxSizeMB} MB each` : ''}
          </p>
        </>
      )}
    </div>
  )
}
