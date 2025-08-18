import { NextRequest, NextResponse } from 'next/server';

const CLAUDE_API_URL = process.env.CLAUDE_API_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:8000/api/v1' : '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!CLAUDE_API_URL) {
      throw new Error('CLAUDE_API_URL is not configured');
    }
    const response = await fetch(`${CLAUDE_API_URL.replace(/\/$/, '')}/claude/populate-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && { 
          'Authorization': request.headers.get('authorization')! 
        }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error populating data:', error);
    return NextResponse.json(
      { error: 'Failed to populate data' },
      { status: 500 }
    );
  }
}