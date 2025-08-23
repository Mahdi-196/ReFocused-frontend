import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/config/environment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(getBackendUrl('/populate-data'), {
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