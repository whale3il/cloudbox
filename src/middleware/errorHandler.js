import multer from 'multer'
import { config } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'

export function notFound(req, res) {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

// Express 5 forwards rejected promises from async handlers here, so controllers
// can simply throw instead of repeating try/catch blocks.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return res.destroy()
    }

    let status = 500
    let message = 'Something went wrong on the server'

    if (err instanceof HttpError) {
        status = err.status
        message = err.message
    } else if (err instanceof multer.MulterError) {
        status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
        message =
            err.code === 'LIMIT_FILE_SIZE'
                ? `File is too large. The maximum size is ${config.maxFileSizeMB} MB per file.`
                : err.code === 'LIMIT_UNEXPECTED_FILE'
                  ? 'Unexpected upload field name.'
                  : err.message
    } else if (err?.type === 'entity.parse.failed') {
        status = 400
        message = 'Malformed JSON body'
    } else {
        console.error(err)
    }

    res.status(status).json({ message })
}
