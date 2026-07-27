import { NextResponse } from 'next/server';
import { isValidTheme } from '@/app/lib/config/theme';
import { query } from '@/app/lib/db';

export async function PATCH(request: Request) {
  try {
    const { theme } = await request.json();

    if (!isValidTheme(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    // Match how your other preference routes get the user.
    const userId = await getUserId(request);   // <-- replace with your actual call
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await query(
      `UPDATE user_preferences
       SET theme = ?, updated_at = datetime('now')
       WHERE user_id = ?`,
      [theme, userId]
    );

    return NextResponse.json({ theme });
  } catch (error) {
    console.error('Failed to save theme:', error);
    return NextResponse.json({ error: 'Failed to save theme' }, { status: 500 });
  }
}