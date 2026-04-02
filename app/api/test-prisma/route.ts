import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('=== Prisma Debug Test ===');
    console.log('1. prisma type:', typeof prisma);
    console.log('2. prisma is null/undefined:', prisma === null || prisma === undefined);

    if (prisma) {
      const keys = Object.keys(prisma);
      console.log('3. prisma has', keys.length, 'keys');
      console.log('4. First 30 keys:', keys.slice(0, 30));
      console.log('5. transitionClient exists:', 'transitionClient' in prisma);
      console.log('6. transitionClient type:', typeof (prisma as any).transitionClient);
    }

    return NextResponse.json({
      success: true,
      prismaType: typeof prisma,
      isNull: prisma === null,
      isUndefined: prisma === undefined,
      keys: prisma ? Object.keys(prisma).slice(0, 30) : [],
      hasTransitionClient: prisma ? 'transitionClient' in prisma : false,
    });
  } catch (error) {
    console.error('Prisma test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
