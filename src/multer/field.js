import multer from 'multer'
import { FIELD_GROUPS } from '../config/fileTypes.js'
import { fieldFilter, limits } from './shared.js'

export const uploadField = multer({
    storage: multer.memoryStorage(),
    limits,
    fileFilter: fieldFilter(FIELD_GROUPS),
})

export const fields = Object.keys(FIELD_GROUPS).map((name) => ({ name }))
