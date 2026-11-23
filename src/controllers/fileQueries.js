import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { config } from '../config/env.js'
import { FILE_TYPES, mimeFromFilename } from '../config/fileTypes.js'
import { HttpError, contentDisposition, parseId } from '../utils/httpError.js'
import { findFileById, listFiles, serializeFile } from '../services/fileService.js'

// GET /cloud/config  - lets the frontend validate files before uploading
export const getConfig = (req, res) => {
    res.json({
        maxFileSizeMB: config.maxFileSizeMB,
        allowedExtensions: Object.keys(FILE_TYPES),
    })
}

// GET /cloud/files?search=report
export const listAll = async (req, res) => {
    const search = String(req.query.search ?? '').trim().slice(0, 100)
    const records = await listFiles({ search })
    res.json({ count: records.length, files: records.map(serializeFile) })
}

// GET /cloud/files/:id
export const getOne = async (req, res) => {
    const record = await findFileById(parseId(req.params.id))
    if (!record) throw new HttpError(404, 'File not found')
    res.json({ file: serializeFile(record) })
}

// Streams the file from Cloudinary through the API so we control the filename,
// the Content-Type and whether the browser downloads or displays it.
async function streamFile(req, res, disposition) {
    const record = await findFileById(parseId(req.params.id))
    if (!record) throw new HttpError(404, 'File not found')

    const upstream = await fetch(record.url)

    if (!upstream.ok || !upstream.body) {
        const blocked = upstream.status === 401 || upstream.status === 403
        throw new HttpError(
            502,
            blocked
                ? 'Cloudinary refused to deliver this file. For PDFs and ZIPs, enable "Allow delivery of PDF and ZIP files" in Cloudinary Settings > Security.'
                : `Could not fetch the file from storage (status ${upstream.status})`
        )
    }

    res.setHeader('Content-Type', mimeFromFilename(record.filename))
    res.setHeader('Content-Disposition', contentDisposition(disposition, record.filename))
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // fetch() transparently decompresses, so the upstream length would be wrong
    const length = upstream.headers.get('content-length')
    if (length && !upstream.headers.get('content-encoding')) {
        res.setHeader('Content-Length', length)
    }

    try {
        await pipeline(Readable.fromWeb(upstream.body), res)
    } catch (err) {
        // The browser closed the tab/connection mid-download: nothing to report
        if (err.code !== 'ERR_STREAM_PREMATURE_CLOSE') throw err
    }
}

// GET /cloud/files/:id/download  -> saved as a file
export const downloadFile = (req, res) => streamFile(req, res, 'attachment')

// GET /cloud/files/:id/preview   -> shown inline (PDFs, text, ...)
export const previewFile = (req, res) => streamFile(req, res, 'inline')
