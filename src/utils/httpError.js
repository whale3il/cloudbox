export class HttpError extends Error {
    constructor(status, message) {
        super(message)
        this.name = 'HttpError'
        this.status = status
    }
}

// Validates the :id route parameter (Prisma ids are 32-bit integers)
export function parseId(value) {
    const id = Number(value)
    if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
        throw new HttpError(400, 'Invalid file id')
    }
    return id
}

export function contentDisposition(type, filename) {
    const fallback = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')
    const encoded = encodeURIComponent(filename).replace(
        /['()*]/g,
        (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase()
    )
    return `${type}; filename="${fallback}"; filename*=UTF-8''${encoded}`
}
