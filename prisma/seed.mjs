import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = process.env.SUPER_ADMIN_USERNAME
  const password = process.env.SUPER_ADMIN_PASSWORD

  if (!username || !password) {
    console.log('Skipping super admin seed: SUPER_ADMIN_USERNAME/PASSWORD missing')
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      username,
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  console.log(`Super admin ensured: ${username}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
