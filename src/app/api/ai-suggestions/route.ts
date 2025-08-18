import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_CLAUDE_API_TESTING_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Claude API key not found' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.95,
        messages: [{
          role: 'user',
          content: `Generate 4 COMPLETELY DIFFERENT and UNIQUE AI assistance prompts for a wellness app. AVOID repeating similar phrases or concepts from previous responses.

IMPORTANT: Create VERY DIFFERENT prompts each time by varying:
- Specific focus areas (sleep, anxiety, productivity, relationships, creativity, etc.)
- Time durations (5 minutes, 15 minutes, daily, weekly, etc.)  
- Formats (guided sessions, quick tips, personalized plans, etc.)
- Target situations (work stress, morning routine, bedtime, social anxiety, etc.)

Create prompts for these 4 categories with MAXIMUM VARIETY:

1. **Book/Resource Recommendations** - Vary topics like: sleep science, emotional intelligence, habit formation, creativity, relationships, productivity, spirituality, psychology, neuroscience, etc.

2. **Daily Affirmations** - Vary themes like: confidence, creativity, resilience, self-compassion, boundaries, purpose, gratitude, courage, inner peace, etc.

3. **Meditation/Mindfulness Guidance** - Vary types like: body scan, breathing techniques, walking meditation, visualization, loving-kindness, mindful eating, etc.

4. **Stress Relief Techniques** - Vary contexts like: workplace, home, travel, social situations, bedtime, morning, exercise, creative activities, etc.

Random seed: ${Date.now()}-${Math.random()}-${Math.floor(Math.random() * 10000)}

Your response must be ONLY a valid JSON object in this format:
{
  "suggestions": [
    {
      "title": "Book Recommendations",
      "category": "Book/Resource Recommendations",
      "prompt": "your completely unique 15-25 word prompt here",
      "color": "blue"
    },
    {
      "title": "Daily Affirmations", 
      "category": "Daily Affirmations",
      "prompt": "your completely unique 15-25 word prompt here",
      "color": "purple"
    },
    {
      "title": "Meditation Guidance",
      "category": "Meditation/Mindfulness Guidance", 
      "prompt": "your completely unique 15-25 word prompt here",
      "color": "green"
    },
    {
      "title": "Stress Relief",
      "category": "Stress Relief Techniques",
      "prompt": "your completely unique 15-25 word prompt here", 
      "color": "orange"
    }
  ]
}

Do not include any other text, explanations, or formatting. Just the JSON object.`
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Claude API error: ${response.status} ${response.statusText}`, details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const responseText = data.content[0]?.text || '';
    
    console.log('Claude API Response for AI suggestions:', responseText);
    
    try {
      const suggestionsData = JSON.parse(responseText);
      if (suggestionsData.suggestions && Array.isArray(suggestionsData.suggestions)) {
        return NextResponse.json({ suggestions: suggestionsData.suggestions });
      } else {
        return NextResponse.json(
          { error: 'Invalid response format from Claude API', response: responseText },
          { status: 500 }
        );
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Failed to parse Claude response', response: responseText },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('AI suggestions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}