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
        max_tokens: 1000,
        temperature: 0.9,
        messages: [{
          role: 'user',
          content: `Generate 5 UNIQUE and DIVERSE writing prompts for daily reflection. Each should be a thoughtful question (8-12 words) that encourages deeper self-reflection.

IMPORTANT: Draw inspiration from these themes and make them more nuanced:
- Gratitude and what shaped it
- Personal growth through challenges
- Meaningful connections and relationships
- Resilience and inner strength
- Sources of joy and fulfillment
- Values and how they guide decisions
- Self-compassion and personal care
- Memories that influenced growth
- Beliefs that have evolved
- Presence and mindful moments
- Learning from difficult experiences
- What brings authentic happiness
- How you show up for others

Make them similar in style to these examples but with more depth:
- What am I most grateful for today?
- What challenge did I overcome?
- How did I grow today?
- What brought me joy?
- What would I like to improve tomorrow?

AIM FOR DEPTH: Each question should be 8-12 words and encourage thoughtful reflection.

Random seed: ${Date.now()}-${Math.random()}

Your response must be ONLY a valid JSON array of 5 strings, like:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]

Do not include any other text, explanations, or formatting. Just the JSON array.`
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
    
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.log('Claude API Response:', responseText);
    }
    
    try {
      const promptsArray = JSON.parse(responseText);
      if (Array.isArray(promptsArray) && promptsArray.length === 5) {
        if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
          console.log('Generated prompts:', promptsArray);
        }
        return NextResponse.json({ prompts: promptsArray });
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
    console.error('Writing prompts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}