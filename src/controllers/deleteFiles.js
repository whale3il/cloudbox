import { HttpError, parseId } from '../utils/httpError.js'
import { findFileById, findFileByPublicId, removeFile } from '../services/fileService.js'

// DELETE /cloud/files/:id
export const deleteFileById = async (req, res) => {
    const record = await findFileById(parseId(req.params.id))
    if (!record) throw new HttpError(404, 'File not found')

    await removeFile(record)
    res.status(200).json({ message: 'File deleted successfully' })
}

// DELETE /cloud/delete   (body: { public_id })
// Original endpoint, kept for backwards compatibility.
export const deleteFiles = async (req, res) => {
    const publicId = req.body?.public_id
    if (!publicId) throw new HttpError(400, 'public_id is required')

    const record = await findFileByPublicId(publicId)
    if (!record) throw new HttpError(404, 'File not found')

    await removeFile(record)
    res.status(200).json({ message: 'File deleted successfully' })
}
