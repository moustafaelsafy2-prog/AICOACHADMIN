import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, type, deliveryFee, deliveryWorkerId, customerId, paymentType } = await request.json();

    // Create the order and items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Recalculate totalAmount from the database to prevent client spoofing
      let calculatedTotalAmount = 0;
      const parsedDeliveryFee = parseFloat(deliveryFee) || 0;
      calculatedTotalAmount += parsedDeliveryFee;

      const orderItemsData = [];
      for (const item of items) {
         const dbProduct = await tx.product.findUnique({ where: { id: item.productId } });
         if (!dbProduct) throw new Error(`Product ${item.productId} not found`);
         const linePrice = dbProduct.price * item.quantity;
         calculatedTotalAmount += linePrice;
         orderItemsData.push({
           productId: item.productId,
           quantity: item.quantity,
           price: dbProduct.price
         });
      }

      // 1. Create order
      const newOrder = await tx.order.create({
        data: {
          totalAmount: calculatedTotalAmount,
          type: type || "TAKEAWAY",
          deliveryFee: parsedDeliveryFee,
          deliveryWorkerId: deliveryWorkerId ? parseInt(deliveryWorkerId) : null,
          customerId: customerId ? parseInt(customerId) : null,
          paymentType: paymentType || "CASH",
          items: {
            create: orderItemsData
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
          data: { balance: { increment: calculatedTotalAmount } }
        });
      }

      if (customerId) {
        await tx.customer.update({
          where: { id: parseInt(customerId) },
          data: { loyaltyPoints: { increment: Math.floor(calculatedTotalAmount / 10) } } // Example: 1 point per 10 currency
        });
      }

      // 1.6 Delivery Worker Balance (if CASH delivery, driver collects money)
      if (type === 'DELIVERY' && deliveryWorkerId && paymentType === 'CASH') {
        await tx.deliveryWorker.update({
          where: { id: parseInt(deliveryWorkerId) },
          data: { balance: { increment: calculatedTotalAmount } }
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
