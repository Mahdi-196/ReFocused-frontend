import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/config/environment';

export const dynamic = 'force-static';

export async function GET() {
  try {
    const response = await fetch(getBackendUrl('/weekly-theme'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching weekly theme:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch weekly theme' },
      { status: 500 }
    );
  }
}
