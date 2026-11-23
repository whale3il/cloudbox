import dotenv from 'dotenv'

dotenv.config({ quiet: true })

// Accept the new variable names, but fall back to the names used in the
// original project so an existing .env file keeps working.
const pick = (...names) =>
    names.map((name) => process.env[name]).find((value) => value !== undefined && value !== '')

export const config = {
    port: Number(process.env.PORT) || 5000,
    // Comma separated list of origins allowed to call the API from a browser
    clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    // Cloudinary's free plan allows up to 10 MB for images and raw files
    maxFileSizeMB: Number(process.env.MAX_FILE_SIZE_MB) || 10,
    databaseUrl: process.env.DATABASE_URL,
    mongoUrl: pick('MONGODB_URL', 'MongoDB_URL'),
    cloudinary: {
        cloud_name: pick('CLOUDINARY_CLOUD_NAME', 'cloud_name'),
        api_key: pick('CLOUDINARY_API_KEY', 'api_key'),
        api_secret: pick('CLOUDINARY_API_SECRET', 'api_secret'),
    },
}

export function assertConfig() {
    const missing = []
    if (!config.databaseUrl) missing.push('DATABASE_URL')
    if (!config.mongoUrl) missing.push('MONGODB_URL')
    if (!config.cloudinary.cloud_name) missing.push('CLOUDINARY_CLOUD_NAME')
    if (!config.cloudinary.api_key) missing.push('CLOUDINARY_API_KEY')
    if (!config.cloudinary.api_secret) missing.push('CLOUDINARY_API_SECRET')

    if (missing.length > 0) {
        throw new Error(
            `Missing environment variables: ${missing.join(', ')}. ` +
                'Copy .env.example to .env and fill in the values.'
        )
    }
}
