import { NextRequest, NextResponse } from 'next/server';

// POST /api/trip/select — save active trip ID in a cookie
export async function POST(req: NextRequest) {
  try {
    const { tripId } = await req.json();
    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set('active_trip_id', tripId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      sameSite: 'lax',
    });
    return response;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
