import { HttpError, parseId } from '../utils/httpError.js'
import { findFileById, findFileByPublicId, replaceFile, serializeFile } from '../services/fileService.js'
import { rejectInvalidFiles } from './uploadHelpers.js'

async function replaceAndRespond(record, req, res) {
    if (rejectInvalidFiles(req, res)) return
    if (!req.file) throw new HttpError(400, 'No file uploaded')

    const updated = await replaceFile(record, req.file)
    res.status(200).json({ message: 'File updated successfully', file: serializeFile(updated) })
}

// PUT /cloud/files/:id   (multipart field: "single")
export const replaceFileById = async (req, res) => {
    const record = await findFileById(parseId(req.params.id))
    if (!record) throw new HttpError(404, 'File not found')

    await replaceAndRespond(record, req, res)
}

// PUT /cloud/update   (multipart: "single" + text field "public_id")
// Original endpoint, kept for backwards compatibility.
export const updateFiles = async (req, res) => {
    const publicId = req.body?.public_id
    if (!publicId) throw new HttpError(400, 'public_id is required')

    const record = await findFileByPublicId(publicId)
    if (!record) throw new HttpError(404, 'File not found')

    await replaceAndRespond(record, req, res)
}
