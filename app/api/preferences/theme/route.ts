import { NextResponse } from 'next/server';
import { THEMES, DEFAULT_THEME, isValidTheme, type ThemeKey } from '@/app/lib/config/theme';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { theme } = body;

    if (!isValidTheme(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    // const userId = await getCurrentUserId();
    // await db.run(
    //   `UPDATE user_preferences
    //    SET theme = ?, updated_at = datetime('now')
    //    WHERE user_id = ?`,
    //   [theme, userId]
    // );

    return NextResponse.json({ theme });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save theme' }, { status: 500 });
  }
}