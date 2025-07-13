import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.CLAUDE_API_TESTING_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      );
    }

    const mindFuelPrompt = {
      "task": "Generate unique content for a 'Mind Fuel' application screen.",
      "instructions": {
        "tone": "Inspirational, positive, and concise.",
        "uniqueness": "All generated content must be new and different from any previous request.",
        "format": "Populate the 'content_payload' object below with newly generated text that fulfills the description for each key. Your response should only be the completed JSON object."
      },
      "content_payload": {
        "weeklyFocus": {
          "description": "Generate a short, encouraging phrase or mantra for the week.",
          "focus": "<string>"
        },
        "tipOfTheDay": {
          "description": "Generate a single, actionable tip for improving daily workflow or well-being.",
          "tip": "<string>"
        },
        "productivityHack": {
          "description": "Generate a specific, actionable productivity hack or a well-known rule.",
          "hack": "<string>"
        },
        "brainBoost": {
          "description": "Generate an insightful word and its concise definition.",
          "word": "<string>",
          "definition": "<string>"
        },
        "mindfulnessMoment": {
          "description": "Generate a brief, simple instruction for a mindfulness exercise, like a breathing technique.",
          "moment": "<string>"
        }
      }
    };

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: JSON.stringify(mindFuelPrompt, null, 2)
          }
        ]
      })
    });

    const data = await claudeResponse.json();

    if (!claudeResponse.ok) {
      return NextResponse.json(
        { error: 'Claude API request failed', details: data },
        { status: claudeResponse.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error calling Claude API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 