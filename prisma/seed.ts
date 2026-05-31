import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    log: ['query'],
})

async function main() {
  const category = await prisma.category.create({
    data: { name: 'المشروبات' }
  })

  await prisma.product.createMany({
    data: [
      { name: 'قهوة اسبريسو', price: 15, stock: 100, categoryId: category.id },
      { name: 'كابتشينو', price: 18, stock: 50, categoryId: category.id },
      { name: 'مياه معدنية', price: 2, stock: 200, categoryId: category.id },
      { name: 'عصير برتقال', price: 12, stock: 30, categoryId: category.id },
    ]
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
