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
        { name: 'قهوة اسبريسو', price: 15, stock: 100, categoryId: category.id, imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80' },
        { name: 'كابتشينو', price: 18, stock: 50, categoryId: category.id, imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80' },
        { name: 'مياه معدنية', price: 2, stock: 200, categoryId: category.id, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80' },
        { name: 'عصير برتقال', price: 12, stock: 30, categoryId: category.id, imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80' },
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