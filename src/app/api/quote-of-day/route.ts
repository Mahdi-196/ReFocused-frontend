import { NextRequest, NextResponse } from 'next/server';

const CLAUDE_API_URL = process.env.CLAUDE_API_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:8000/api/v1' : '');

export async function GET() {
  try {
    if (!CLAUDE_API_URL) {
      throw new Error('CLAUDE_API_URL is not configured');
    }
    const response = await fetch(`${CLAUDE_API_URL.replace(/\/$/, '')}/claude/quote-of-day`, {
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
    console.error('Error fetching quote of day:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote of day' },
      { status: 500 }
    );
  }
}