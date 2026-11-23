import { serializeFile, storeFile } from '../services/fileService.js'

// Responds with 400 (and returns true) when the multer filter rejected any file
export function rejectInvalidFiles(req, res) {
    if (!req.invalidFiles?.length) return false

    const names = req.invalidFiles.map((file) => file.name).join(', ')
    res.status(400).json({
        message: `Unsupported file type: ${names}`,
        invalidFiles: req.invalidFiles,
    })
    return true
}

// Stores files one by one. A failure on one file does not stop the others.
export async function storeMany(files) {
    const stored = []
    const errors = []

    for (const file of files) {
        try {
            stored.push(serializeFile(await storeFile(file)))
        } catch (err) {
            console.error(`Upload failed for ${file.originalname}:`, err.message)
            errors.push({ filename: file.originalname, message: err.message })
        }
    }

    return { stored, errors }
}

export function sendUploadResult(res, { stored, errors }) {
    if (stored.length === 0) {
        return res.status(500).json({ message: `Upload failed: ${errors[0]?.message ?? 'unknown error'}`, errors })
    }

    const message =
        stored.length === 1 ? 'File uploaded successfully' : `${stored.length} files uploaded successfully`
    res.status(201).json({ message, files: stored, errors })
}
