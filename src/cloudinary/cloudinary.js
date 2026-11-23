import { v2 as cloudinary } from 'cloudinary'
import { config } from '../config/env.js'
import { resourceTypeForMime, resourceTypeFromUrl } from '../config/fileTypes.js'

cloudinary.config({ ...config.cloudinary, secure: true })

const FOLDERS = {
    image: 'images_uploads',
    video: 'videos_uploads',
    raw: 'documents_uploads',
}

const uploadBuffer = (buffer, resource_type, folder) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ resource_type, folder }, (err, result) => {
            if (err) {
                // Cloudinary rejects with a plain object, normalise it to an Error
                return reject(err instanceof Error ? err : new Error(err.message || 'Cloudinary upload failed'))
            }
            resolve(result)
        })
        stream.end(buffer)
    })

// Original helpers, kept for backwards compatibility
export const uploadToCloudinaryImage = (buffer, folder = FOLDERS.image) => uploadBuffer(buffer, 'image', folder)
export const uploadToCloudinaryVideo = (buffer, folder = FOLDERS.video) => uploadBuffer(buffer, 'video', folder)
export const uploadToCloudinarypdf = (buffer, folder = FOLDERS.raw) => uploadBuffer(buffer, 'raw', folder)

// Picks the right Cloudinary resource type from the file's MIME type
export const uploadFile = (buffer, mimeType) => {
    const type = resourceTypeForMime(mimeType)
    return uploadBuffer(buffer, type, FOLDERS[type])
}

// Deleting needs the resource type the asset was uploaded with.
// It is encoded in the stored URL (/image/upload/, /video/upload/, /raw/upload/).
export async function destroyFile(publicId, url) {
    const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceTypeFromUrl(url),
        invalidate: true,
    })
    if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Cloudinary could not delete the file (${result.result})`)
    }
    return result
}

export default cloudinary
