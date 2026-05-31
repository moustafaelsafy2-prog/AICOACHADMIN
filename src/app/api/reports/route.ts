import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Total Sales and Orders
    const orders = await prisma.order.findMany({
      include: { items: { include: { product: true } } }
    });

    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrdersCount = orders.length;

    // 2. Today's Sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysOrders = orders.filter(o => new Date(o.createdAt) >= today);
    const todaysSales = todaysOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // 3. Delivery Stats
    const deliveryOrders = orders.filter(o => o.type === 'DELIVERY');
    const totalDeliveryFees = deliveryOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);
    const totalDeliveries = deliveryOrders.length;

    // 4. Top Selling Products
    const productSales: Record<number, { name: string, quantity: number, revenue: number }> = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.product.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += (item.quantity * item.price);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return NextResponse.json({
      totalSales,
      totalOrdersCount,
      todaysSales,
      totalDeliveries,
      totalDeliveryFees,
      topProducts
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
