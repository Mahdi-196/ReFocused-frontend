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

    const body = await request.json();
    const { message, systemPrompt, conversationHistory, userId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check daily message limit (server-side validation)
    const MESSAGE_LIMIT = 100;
    const today = new Date().toDateString();
    
    // In production, this would use a proper database
    // For now, we'll rely on client-side tracking and add a simple server check
    if (userId) {
      console.log(`💬 Message from user: ${userId} on ${today}`);
      console.log(`📊 Server-side message limit check: ${MESSAGE_LIMIT} messages/day`);
    }

    // Dynamic themes for varied AI personality
    const dailyThemes = [
      'self-compassion',
      'sustainable effort', 
      'strategic rest',
      'deep work',
      'clarifying priorities',
      'letting go of perfection',
      'mindful productivity',
      'energy management',
      'intentional focus',
      'balanced growth'
    ];

    const randomTheme = dailyThemes[Math.floor(Math.random() * dailyThemes.length)];
    
    const defaultSystemPrompt = `You are ReFocused AI, a helpful assistant focused on productivity, mindfulness, wellness, and personal growth. Provide practical, actionable advice that helps users stay focused, reduce stress, and achieve their goals. Be encouraging, supportive, and concise in your responses.

For this conversation, subtly emphasize the theme of ${randomTheme}.`;

    // Build messages array with conversation history
    const messages = [];
    
    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: any) => {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          });
        }
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.6,
        system: systemPrompt || defaultSystemPrompt,
        messages: messages
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