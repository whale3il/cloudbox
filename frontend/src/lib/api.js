// Thin wrapper around the Express API.
// "/cloud" is proxied to the backend by Vite (see vite.config.js).
// Set VITE_API_URL to call a backend hosted somewhere else.
const BASE = (import.meta.env.VITE_API_URL || '/cloud').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

const NETWORK_MESSAGE = 'Cannot reach the server. Make sure the backend is running.'

async function request(path, options) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, options)
  } catch {
    throw new ApiError(NETWORK_MESSAGE)
  }

  const isJson = (response.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    throw new ApiError(data?.message || `Request failed (${response.status})`, response.status, data)
  }
  return data
}

export const getConfig = () => request('/config')

export const listFiles = (search = '') =>
  request(`/files${search ? `?search=${encodeURIComponent(search)}` : ''}`)

export const deleteFile = (id) => request(`/files/${id}`, { method: 'DELETE' })

export function replaceFile(id, file) {
  const body = new FormData()
  body.append('single', file)
  return request(`/files/${id}`, { method: 'PUT', body })
}

// Plain URLs: the browser handles these directly (<a download>, <iframe>)
export const downloadUrl = (id) => `${BASE}/files/${id}/download`
export const previewUrl = (id) => `${BASE}/files/${id}/preview`

export async function fetchText(id, signal) {
  let response
  try {
    response = await fetch(previewUrl(id), { signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(NETWORK_MESSAGE)
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new ApiError(data?.message || `Could not load preview (${response.status})`, response.status)
  }
  return response.text()
}

// Uses XMLHttpRequest because fetch cannot report upload progress.
// One file goes to /single, several go to /array.
export function uploadFiles(files, onProgress) {
  return new Promise((resolve, reject) => {
    const endpoint = files.length > 1 ? 'array' : 'single'
    const body = new FormData()
    files.forEach((file) => body.append(endpoint, file))

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE}/${endpoint}`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onerror = () => reject(new ApiError(NETWORK_MESSAGE))
    xhr.onload = () => {
      let data = null
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        // not JSON (e.g. a proxy error page)
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data)
      reject(new ApiError(data?.message || `Upload failed (${xhr.status})`, xhr.status, data))
    }

    xhr.send(body)
  })
}
