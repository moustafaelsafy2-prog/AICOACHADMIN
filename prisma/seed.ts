import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
    log: ['query'],
})

async function main() {
  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@pos.com' },
    update: {},
    create: {
      name: 'المدير العام',
      email: 'admin@pos.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Create category if not exists
  const category = await prisma.category.findFirst({
    where: { name: 'المشروبات' }
  }) || await prisma.category.create({
    data: { name: 'المشروبات' }
  })

  // Check products
  const productsCount = await prisma.product.count()
  if (productsCount === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'قهوة اسبريسو', price: 15, stock: 100, categoryId: category.id },
        { name: 'كابتشينو', price: 18, stock: 50, categoryId: category.id },
        { name: 'مياه معدنية', price: 2, stock: 200, categoryId: category.id },
        { name: 'عصير برتقال', price: 12, stock: 30, categoryId: category.id },
      ]
    })
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })