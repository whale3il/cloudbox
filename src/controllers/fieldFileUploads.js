import { rejectInvalidFiles, sendUploadResult, storeMany } from './uploadHelpers.js'

// POST /cloud/field   (multipart fields: images, csv, documents, videos)
export const fieldFileUploads = async (req, res) => {
    if (rejectInvalidFiles(req, res)) return

    // req.files is an object keyed by field name, so flatten it
    const files = Object.values(req.files ?? {}).flat()

    if (files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' })
    }

    sendUploadResult(res, await storeMany(files))
}
