import mongoose from 'mongoose'
import { config } from '../config/env.js'

export const connectdb = async () => {
    try {
        await mongoose.connect(config.mongoUrl, { serverSelectionTimeoutMS: 8000 })
        console.log('MongoDB connected successfully')
    } catch (err) {
        console.error('MongoDB connection failed:', err.message)
        throw err
    }
}
