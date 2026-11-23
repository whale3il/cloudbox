import multer from 'multer'
import { fileFilter, limits } from './shared.js'

export const uploadsArray = multer({
    storage: multer.memoryStorage(),
    limits: { ...limits, files: 20 },
    fileFilter,
})
