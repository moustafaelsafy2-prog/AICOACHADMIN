import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const shift = await prisma.shift.findFirst({
      where: {
        userId: parseInt(session.user.id as string),
        status: 'OPEN'
      }
    });
    return NextResponse.json(shift || { status: 'CLOSED' });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch shift' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, startCash, endCash } = await request.json();
    const userId = parseInt(session.user.id as string);

    if (action === 'OPEN') {
      const shift = await prisma.shift.create({
        data: {
          userId,
          startCash: parseFloat(startCash || 0),
          status: 'OPEN'
        }
      });
      return NextResponse.json(shift);
    }

    if (action === 'CLOSE') {
      const shift = await prisma.shift.findFirst({
        where: { userId, status: 'OPEN' }
      });
      if (!shift) return NextResponse.json({ error: 'No open shift' }, { status: 400 });

      const closedShift = await prisma.shift.update({
        where: { id: shift.id },
        data: {
          status: 'CLOSED',
          endTime: new Date(),
          endCash: parseFloat(endCash || 0)
        }
      });
      return NextResponse.json(closedShift);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to process shift' }, { status: 500 });
  }
}
