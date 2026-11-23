import express from 'express'
import { upload } from '../multer/single.js'
import { uploadsArray } from '../multer/mutipleFiles.js'
import { fields, uploadField } from '../multer/field.js'
import { singeFileUploads } from '../controllers/singeFileUploads.js'
import { murtipleFileUploads } from '../controllers/MutipleFileUploads.js'
import { fieldFileUploads } from '../controllers/fieldFileUploads.js'
import { replaceFileById, updateFiles } from '../controllers/fileUpdate.js'
import { deleteFileById, deleteFiles } from '../controllers/deleteFiles.js'
import { downloadFile, getConfig, getOne, listAll, previewFile } from '../controllers/fileQueries.js'

const router = express.Router()

router.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'CloudBox API' })
})

router.get('/config', getConfig)

// ---- Used by the React app -------------------------------------------------
router.get('/files', listAll)
router.get('/files/:id', getOne)
router.get('/files/:id/download', downloadFile)
router.get('/files/:id/preview', previewFile)
router.put('/files/:id', upload.single('single'), replaceFileById)
router.delete('/files/:id', deleteFileById)

// single file upload
router.post('/single', upload.single('single'), singeFileUploads)

// multiple file upload
router.post('/array', uploadsArray.array('array'), murtipleFileUploads)

// ---- Original endpoints, kept for compatibility ----------------------------
router.post('/field', uploadField.fields(fields), fieldFileUploads)
router.put('/update', upload.single('single'), updateFiles)
router.delete('/delete', upload.none(), deleteFiles)

export default router
