import express from 'express'
import cors from 'cors'
import { assertConfig, config } from './src/config/env.js'
import { connectdb } from './src/Mongodb/mongodb.js'
import { connectPrisma, prisma } from './src/lib/prisma.js'
import router from './src/routes/routes.js'
import { errorHandler, notFound } from './src/middleware/errorHandler.js'

const app = express()

app.use(
    cors({
        origin: config.clientOrigin.split(',').map((origin) => origin.trim()),
        exposedHeaders: ['Content-Disposition'],
    })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.use('/cloud', router)

app.use(notFound)
app.use(errorHandler)

async function start() {
    try {
        assertConfig()
        await connectdb()
        await connectPrisma()
    } catch (err) {
        console.error(`\nCould not start the server: ${err.message}\n`)
        process.exit(1)
    }

    const server = app.listen(config.port, () => {
        console.log(`Server started at http://localhost:${config.port}`)
    })

    const shutdown = async () => {
        server.close()
        await prisma.$disconnect()
        process.exit(0)
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
}

start()
