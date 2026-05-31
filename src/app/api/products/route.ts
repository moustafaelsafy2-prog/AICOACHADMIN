import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        recipeItems: {
          include: {
            ingredient: true
          }
        }
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, price, stock, categoryId, barcode, imageUrl, type, unit, ingredients } = await request.json();

    const productData: any = {
      name,
      price,
      stock: type === 'COMPOSITE' ? 0 : stock,
      categoryId,
      barcode,
      imageUrl,
      type: type || 'STANDARD',
      unit: unit || 'قطعة'
    };

    if (type === 'COMPOSITE' && ingredients && ingredients.length > 0) {
      productData.recipeItems = {
        create: ingredients.map((ing: any) => ({
          ingredientId: ing.ingredientId,
          quantity: ing.quantity
        }))
      };
    }

    const product = await prisma.product.create({
      data: productData,
      include: {
        recipeItems: true
      }
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
