import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const id = parseInt(params.id);
    const { status } = await request.json();

    if (status !== 'RETURNED') {
       return NextResponse.json({ error: 'Invalid status update' }, { status: 400 });
    }

    // Fetch the order to process the return
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status === 'RETURNED') return NextResponse.json({ error: 'Order already returned' }, { status: 400 });

    // Process the return in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update the order status
      const retOrder = await tx.order.update({
        where: { id },
        data: { status: 'RETURNED' }
      });

      // 2. Revert CRM & Debt Updates
      if (order.customerId && order.paymentType === 'DEBT') {
        await tx.customer.update({
          where: { id: order.customerId },
          data: { balance: { decrement: order.totalAmount } }
        });
      }

      if (order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: { loyaltyPoints: { decrement: Math.floor(order.totalAmount / 10) } }
        });
      }

      // 3. Revert Delivery Worker Balance
      if (order.type === 'DELIVERY' && order.deliveryWorkerId && order.paymentType === 'CASH') {
        await tx.deliveryWorker.update({
          where: { id: order.deliveryWorkerId },
          data: { balance: { decrement: order.totalAmount } }
        });
      }

      // 4. Restore stock
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { recipeItems: true }
        });

        if (product?.type === 'COMPOSITE' && product.recipeItems) {
          // Restore ingredients
          for (const recipeItem of product.recipeItems) {
            await tx.product.update({
              where: { id: recipeItem.ingredientId },
              data: { stock: { increment: recipeItem.quantity * item.quantity } }
            });
          }
        } else if (product?.type === 'STANDARD') {
          // Restore standard product
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      return retOrder;
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to return order' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 401 });
    }

    const params = await context.params;
    const id = parseInt(params.id);
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
