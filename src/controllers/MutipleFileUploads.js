import { rejectInvalidFiles, sendUploadResult, storeMany } from './uploadHelpers.js'

// POST /cloud/array   (multipart field: "array")
export const murtipleFileUploads = async (req, res) => {
    if (rejectInvalidFiles(req, res)) return

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' })
    }

    sendUploadResult(res, await storeMany(req.files))
}
