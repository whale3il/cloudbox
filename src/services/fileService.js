import { prisma } from '../lib/prisma.js'
import fileModel from '../models/model.js'
import { destroyFile, uploadFile } from '../cloudinary/cloudinary.js'
import { kindForMime, mimeFromFilename } from '../config/fileTypes.js'

// PostgreSQL (Prisma) is the source of truth for listing files.
// MongoDB keeps a mirrored copy, written by the same operations below.

export function serializeFile(record) {
    const mimeType = mimeFromFilename(record.filename)
    return {
        id: record.id,
        filename: record.filename,
        size: record.size,
        url: record.url,
        publicId: record.publicId,
        mimeType,
        kind: kindForMime(mimeType),
        createdAt: record.createdNow,
    }
}

export function listFiles({ search = '', limit = 500 } = {}) {
    return prisma.file.findMany({
        where: search ? { filename: { contains: search, mode: 'insensitive' } } : undefined,
        orderBy: { createdNow: 'desc' },
        take: limit,
    })
}

export const findFileById = (id) => prisma.file.findUnique({ where: { id } })

export const findFileByPublicId = (publicId) => prisma.file.findUnique({ where: { publicId } })

const toData = (uploaded, file) => ({
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    filename: file.originalname,
    size: file.size,
})

const ignoreErrors = (label) => (err) => console.warn(`${label}:`, err.message)

// Upload to Cloudinary, then save in PostgreSQL and MongoDB.
// If a database write fails, everything already created is rolled back.
export async function storeFile(file) {
    const uploaded = await uploadFile(file.buffer, mimeFromFilename(file.originalname))
    const data = toData(uploaded, file)
    let record

    try {
        record = await prisma.file.create({ data })
        await fileModel.create(data)
        return record
    } catch (err) {
        if (record) await prisma.file.delete({ where: { id: record.id } }).catch(ignoreErrors('Rollback (prisma)'))
        await destroyFile(uploaded.public_id, uploaded.secure_url).catch(ignoreErrors('Rollback (cloudinary)'))
        throw err
    }
}

// Upload the new file first, update both databases, and only then remove the old
// asset from Cloudinary, so a failure never leaves a record pointing at nothing.
export async function replaceFile(record, file) {
    const uploaded = await uploadFile(file.buffer, mimeFromFilename(file.originalname))
    const data = toData(uploaded, file)
    let updated

    try {
        updated = await prisma.file.update({ where: { id: record.id }, data })
        await fileModel.findOneAndUpdate({ publicId: record.publicId }, data, { upsert: true, returnDocument: 'after' })
    } catch (err) {
        if (updated) {
            const { url, publicId, filename, size } = record
            await prisma.file
                .update({ where: { id: record.id }, data: { url, publicId, filename, size } })
                .catch(ignoreErrors('Rollback (prisma)'))
        }
        await destroyFile(uploaded.public_id, uploaded.secure_url).catch(ignoreErrors('Rollback (cloudinary)'))
        throw err
    }

    await destroyFile(record.publicId, record.url).catch(ignoreErrors('Old asset cleanup (cloudinary)'))
    return updated
}

export async function removeFile(record) {
    await destroyFile(record.publicId, record.url)
    await prisma.file.delete({ where: { id: record.id } })
    await fileModel.deleteMany({ publicId: record.publicId })
}
