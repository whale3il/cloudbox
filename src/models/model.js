import mongoose from 'mongoose'

const fileSchema = new mongoose.Schema(
    {
        url: { type: String, required: true },
        publicId: { type: String, required: true, index: true },
        filename: { type: String, required: true },
        size: { type: Number, required: true },
    },
    // (the original had `timeStamps`, which Mongoose silently ignores)
    { timestamps: true }
)

// Same collection name as before ("cloudinaries"), so existing data is kept
export default mongoose.models.cloudinary || mongoose.model('cloudinary', fileSchema)
