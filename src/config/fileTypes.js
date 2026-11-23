// Single source of truth for which files the app accepts.
// The extension decides the type; the MIME type we store/serve comes from this
// table (never from the browser), which also fixes browsers that report
// CSV files as "application/vnd.ms-excel".

export const FILE_TYPES = {
    // images
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    jfif: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    // video
    mp4: 'video/mp4',
    webm: 'video/webm',
    // documents
    pdf: 'application/pdf',
    txt: 'text/plain',
    csv: 'text/csv',
    md: 'text/markdown',
    json: 'application/json',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

// Used by the /cloud/field endpoint, which only accepts certain types per field
export const FIELD_GROUPS = {
    images: ['png', 'jpg', 'jpeg', 'jfif', 'gif', 'webp'],
    csv: ['csv'],
    documents: ['pdf', 'txt', 'md', 'json', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
    videos: ['mp4', 'webm'],
}

export const getExtension = (filename = '') => {
    const dot = filename.lastIndexOf('.')
    return dot > -1 ? filename.slice(dot + 1).toLowerCase() : ''
}

export const isKnownExtension = (ext) => Object.hasOwn(FILE_TYPES, ext)

export const isAllowedFile = (file) => isKnownExtension(getExtension(file.originalname))

export const mimeFromFilename = (filename) => FILE_TYPES[getExtension(filename)] ?? 'application/octet-stream'

// Cloudinary stores everything that is not an image or a video as "raw"
export const resourceTypeForMime = (mime) =>
    mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : 'raw'

export const resourceTypeFromUrl = (url = '') => /\/(image|video|raw)\/upload\//.exec(url)?.[1] ?? 'raw'

export const kindForMime = (mime) => {
    if (mime.startsWith('image/')) return 'image'
    if (mime.startsWith('video/')) return 'video'
    if (mime === 'application/pdf') return 'pdf'
    if (mime.startsWith('text/') || mime === 'application/json') return 'text'
    if (mime !== 'application/octet-stream') return 'document'
    return 'file'
}
