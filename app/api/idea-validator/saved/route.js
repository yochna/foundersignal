import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { repo } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: { message: 'Authentication required' } }, { status: 401 });
  }

  try {
    const list = await repo.listValidations(user.id);
    return NextResponse.json({ ok: true, data: list || [] });
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: { message: 'Authentication required' } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { idea, result } = body;

    if (!idea || !result) {
      return NextResponse.json({ error: { message: 'Missing idea or result payload' } }, { status: 400 });
    }

    const record = await repo.saveValidation({
      userId: user.id,
      ideaText: idea,
      validationScore: result.validationScore,
      verdict: result.verdict,
      scores: result.scores,
      payload: result,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
