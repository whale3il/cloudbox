export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date)
}

export const getExtension = (filename = '') => {
  const dot = filename.lastIndexOf('.')
  return dot > -1 ? filename.slice(dot + 1).toLowerCase() : ''
}

// Cloudinary can resize on the fly by adding a transformation to the URL
export function thumbnailUrl(file) {
  if (file.kind === 'image' && file.url.includes('/image/upload/')) {
    return file.url.replace('/image/upload/', '/image/upload/c_fill,w_480,h_360,q_auto,f_auto/')
  }
  if (file.kind === 'video' && file.url.includes('/video/upload/')) {
    return file.url.replace('/video/upload/', '/video/upload/so_0,c_fill,w_480,h_360,f_jpg/')
  }
  return null
}
