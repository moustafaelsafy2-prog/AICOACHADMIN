import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, amount } = await request.json();
    const id = parseInt(params.id);

    if (action === 'SETTLE') {
      // Driver turns in their cash
      const worker = await prisma.deliveryWorker.update({
        where: { id },
        data: {
          balance: { decrement: parseFloat(amount) }
        }
      });
      return NextResponse.json(worker);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to update worker' }, { status: 500 });
  }
}
