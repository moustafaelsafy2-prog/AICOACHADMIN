import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const workers = await prisma.deliveryWorker.findMany();
    return NextResponse.json(workers);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, phone } = await request.json();
    const worker = await prisma.deliveryWorker.create({
      data: { name, phone }
    });
    return NextResponse.json(worker, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create worker' }, { status: 500 });
  }
}
