import { config } from '../config/env.js'
import { getExtension, isAllowedFile } from '../config/fileTypes.js'

export const limits = { fileSize: config.maxFileSizeMB * 1024 * 1024 }

// Multer reads multipart filenames as latin1, which garbles names such as
// "résumé.pdf". Convert them back when that is clearly what happened.
export function fixFilename(name = '') {
    if (!/^[\u0000-\u00ff]*$/.test(name)) return name
    const decoded = Buffer.from(name, 'latin1').toString('utf8')
    return decoded.includes('\uFFFD') ? name : decoded
}

const rememberInvalid = (req, file) => {
    if (!req.invalidFiles) req.invalidFiles = []
    req.invalidFiles.push({ name: file.originalname, type: file.mimetype })
}

// Accepts files whose extension is in FILE_TYPES. Rejected files are collected on
// req.invalidFiles so the controller can report all of them at once.
export function fileFilter(req, file, cb) {
    file.originalname = fixFilename(file.originalname)

    if (isAllowedFile(file)) return cb(null, true)

    rememberInvalid(req, file)
    cb(null, false)
}

// Same idea, but each upload field only accepts certain extensions
export function fieldFilter(groups) {
    return (req, file, cb) => {
        file.originalname = fixFilename(file.originalname)

        const allowed = groups[file.fieldname]
        if (allowed?.includes(getExtension(file.originalname))) return cb(null, true)

        rememberInvalid(req, file)
        cb(null, false)
    }
}
