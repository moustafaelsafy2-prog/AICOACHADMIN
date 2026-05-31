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
    // Standard products
    await prisma.product.createMany({
      data: [
        { name: 'قهوة اسبريسو', price: 15, stock: 100, unit: 'كوب', type: 'STANDARD', categoryId: category.id, imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80' },
        { name: 'كابتشينو', price: 18, stock: 50, unit: 'كوب', type: 'STANDARD', categoryId: category.id, imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80' },
        { name: 'مياه معدنية', price: 2, stock: 200, unit: 'عبوة', type: 'STANDARD', categoryId: category.id, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80' },
        { name: 'عصير برتقال', price: 12, stock: 30, unit: 'كوب', type: 'STANDARD', categoryId: category.id, imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80' },
      ]
    })

    // Ingredients
    const strawberry = await prisma.product.create({
      data: { name: 'فراولة طازجة', price: 0, stock: 5000, unit: 'جرام', type: 'INGREDIENT', categoryId: category.id }
    })
    const sugar = await prisma.product.create({
      data: { name: 'سكر', price: 0, stock: 10000, unit: 'جرام', type: 'INGREDIENT', categoryId: category.id }
    })
    const water = await prisma.product.create({
      data: { name: 'ماء مصفى', price: 0, stock: 50000, unit: 'مل', type: 'INGREDIENT', categoryId: category.id }
    })

    // Composite Product
    await prisma.product.create({
      data: {
        name: 'عصير فراولة طازج',
        price: 16,
        stock: 0, // Composite products don't typically have their own stock, it's calculated or ignored
        unit: 'كوب',
        type: 'COMPOSITE',
        categoryId: category.id,
        imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
        recipeItems: {
          create: [
            { ingredientId: strawberry.id, quantity: 200 }, // 200g of strawberries
            { ingredientId: sugar.id, quantity: 20 }, // 20g of sugar
            { ingredientId: water.id, quantity: 150 }, // 150ml of water
          ]
        }
      }
    })
  }

  // Delivery Workers
  const workersCount = await prisma.deliveryWorker.count()
  if (workersCount === 0) {
     await prisma.deliveryWorker.createMany({
       data: [
         { name: 'أحمد محمود', phone: '0501234567' },
         { name: 'علي محمد', phone: '0551234567' }
       ]
     })
  }

  // Initialize Settings
  const settingsCount = await prisma.settings.count()
  if (settingsCount === 0) {
    await prisma.settings.create({
      data: {
        companyName: 'نظام نقاط البيع الاحترافي',
        currency: 'ر.س',
        taxRate: 15.0,
      }
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