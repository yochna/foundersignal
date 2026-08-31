import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { repo } from '@/lib/db';
import { adminEmails } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const dbAdmins = typeof repo?.getAdminEmails === 'function' ? await repo.getAdminEmails().catch(() => []) : [];
    const revokedAdmins = typeof repo?.getRevokedAdminEmails === 'function' ? await repo.getRevokedAdminEmails().catch(() => []) : [];

    // Filter out revoked env admins from active envAdmins
    const activeEnvAdmins = adminEmails.filter((e) => !revokedAdmins.includes(e));

    return NextResponse.json({
      ok: true,
      envAdmins: activeEnvAdmins,
      allEnvAdmins: adminEmails,
      dbAdmins: dbAdmins || [],
      revokedAdmins: revokedAdmins || [],
    });
  } catch (error) {
    const status = error?.status || error?.statusCode || 500;
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch admin list' } },
      { status: typeof status === 'number' ? status : 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const email = (body?.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: { message: 'Please provide a valid email address.' } },
        { status: 400 }
      );
    }

    if (typeof repo?.unrevokeAdminEmail === 'function') {
      await repo.unrevokeAdminEmail(email).catch(() => {});
    }

    const record = typeof repo?.addAdminEmail === 'function' ? await repo.addAdminEmail(email, user.email || 'admin') : { email };
    const allDbAdmins = typeof repo?.getAdminEmails === 'function' ? await repo.getAdminEmails().catch(() => []) : [];
    const revokedAdmins = typeof repo?.getRevokedAdminEmails === 'function' ? await repo.getRevokedAdminEmails().catch(() => []) : [];
    const activeEnvAdmins = adminEmails.filter((e) => !revokedAdmins.includes(e));

    return NextResponse.json({
      ok: true,
      added: record,
      envAdmins: activeEnvAdmins,
      dbAdmins: allDbAdmins,
      revokedAdmins,
    });
  } catch (error) {
    const status = error?.status || error?.statusCode || 500;
    return NextResponse.json(
      { error: { message: error.message || 'Failed to add admin email' } },
      { status: typeof status === 'number' ? status : 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: { message: 'Missing email parameter.' } },
        { status: 400 }
      );
    }

    if (typeof repo?.removeAdminEmail === 'function') {
      await repo.removeAdminEmail(email).catch(() => {});
    }

    const allDbAdmins = typeof repo?.getAdminEmails === 'function' ? await repo.getAdminEmails().catch(() => []) : [];
    const revokedAdmins = typeof repo?.getRevokedAdminEmails === 'function' ? await repo.getRevokedAdminEmails().catch(() => []) : [];
    const activeEnvAdmins = adminEmails.filter((e) => !revokedAdmins.includes(e));

    return NextResponse.json({
      ok: true,
      removed: email,
      envAdmins: activeEnvAdmins,
      dbAdmins: allDbAdmins,
      revokedAdmins,
    });
  } catch (error) {
    const status = error?.status || error?.statusCode || 500;
    return NextResponse.json(
      { error: { message: error.message || 'Failed to remove admin email' } },
      { status: typeof status === 'number' ? status : 500 }
    );
  }
}
