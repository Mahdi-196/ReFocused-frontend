import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/config/environment';

export async function GET() {
  try {
    const response = await fetch(getBackendUrl('/word-of-day'), {
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
      console.error('Error fetching word of day:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch word of day' },
      { status: 500 }
    );
  }
}