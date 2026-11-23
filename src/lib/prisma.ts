import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client.js'
import { config } from '../config/env.js'

const adapter = new PrismaPg({ connectionString: config.databaseUrl })
const prisma = new PrismaClient({ adapter })

// Opens a connection right away so a bad DATABASE_URL fails at startup
// instead of on the first request.
async function connectPrisma() {
    await prisma.$queryRaw`SELECT 1`
    console.log('Prisma (PostgreSQL) connected successfully')
}

export { prisma, connectPrisma }
