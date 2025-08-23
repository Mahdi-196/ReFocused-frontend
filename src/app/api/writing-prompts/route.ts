import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/config/environment';

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(getBackendUrl('/writing-prompts'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: Date.now(),
        randomSeed: Math.random()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Backend API error: ${response.status} ${response.statusText}`, details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.log('Backend API Response:', data);
    }
    
    if (data.prompts && Array.isArray(data.prompts) && data.prompts.length === 5) {
      if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
        console.log('Generated prompts:', data.prompts);
      }
      return NextResponse.json({ prompts: data.prompts });
    } else {
      return NextResponse.json(
        { error: 'Invalid response format from backend API', response: data },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Writing prompts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}