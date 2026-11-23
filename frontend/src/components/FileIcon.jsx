import { File, FileImage, FileSpreadsheet, FileText, FileVideo } from 'lucide-react'

const KINDS = {
  image: { Icon: FileImage, color: 'text-sky-500', bg: 'bg-sky-50', label: 'Image' },
  video: { Icon: FileVideo, color: 'text-violet-500', bg: 'bg-violet-50', label: 'Video' },
  pdf: { Icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50', label: 'PDF' },
  text: { Icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Text' },
  document: { Icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Document' },
  file: { Icon: File, color: 'text-slate-500', bg: 'bg-slate-100', label: 'File' },
}

export const kindStyle = (kind) => KINDS[kind] ?? KINDS.file

export default function FileIcon({ kind, className = 'h-12 w-12' }) {
  const { Icon, color } = kindStyle(kind)
  return <Icon className={`${color} ${className}`} strokeWidth={1.5} aria-hidden="true" />
}
