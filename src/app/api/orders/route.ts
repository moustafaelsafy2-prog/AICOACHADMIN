import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { items, totalAmount, type, deliveryFee, deliveryWorkerId, customerId, paymentType } = await request.json();

    // Create the order and items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const newOrder = await tx.order.create({
        data: {
          totalAmount,
          type: type || "TAKEAWAY",
          deliveryFee: parseFloat(deliveryFee) || 0,
          deliveryWorkerId: deliveryWorkerId ? parseInt(deliveryWorkerId) : null,
          customerId: customerId ? parseInt(customerId) : null,
          paymentType: paymentType || "CASH",
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            }))
          }
        },
        include: {
          items: true,
          customer: true,
          deliveryWorker: true
        }
      });

      // 1.5 CRM & Debt Updates
      if (customerId && paymentType === 'DEBT') {
        await tx.customer.update({
          where: { id: parseInt(customerId) },
          data: { balance: { increment: totalAmount } }
        });
      }

      if (customerId) {
        await tx.customer.update({
          where: { id: parseInt(customerId) },
          data: { loyaltyPoints: { increment: Math.floor(totalAmount / 10) } } // Example: 1 point per 10 currency
        });
      }

      // 1.6 Delivery Worker Balance (if CASH delivery, driver collects money)
      if (type === 'DELIVERY' && deliveryWorkerId && paymentType === 'CASH') {
        await tx.deliveryWorker.update({
          where: { id: parseInt(deliveryWorkerId) },
          data: { balance: { increment: totalAmount } }
        });
      }

      // 2. Decrement stock for each product or its ingredients
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { recipeItems: true }
        });

        if (product?.type === 'COMPOSITE' && product.recipeItems) {
          // Deduct from ingredients
          for (const recipeItem of product.recipeItems) {
            await tx.product.update({
              where: { id: recipeItem.ingredientId },
              data: {
                stock: {
                  decrement: recipeItem.quantity * item.quantity
                }
              }
            });
          }
        } else if (product?.type === 'STANDARD') {
          // Deduct from standard product
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
  }
}
