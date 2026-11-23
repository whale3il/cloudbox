import { rejectInvalidFiles, sendUploadResult, storeMany } from './uploadHelpers.js'

// POST /cloud/single   (multipart field: "single")
export const singeFileUploads = async (req, res) => {
    if (rejectInvalidFiles(req, res)) return

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' })
    }

    sendUploadResult(res, await storeMany([req.file]))
}
