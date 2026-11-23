import multer from 'multer'
import { fileFilter, limits } from './shared.js'

export const upload = multer({
    storage: multer.memoryStorage(),
    limits,
    fileFilter,
})
