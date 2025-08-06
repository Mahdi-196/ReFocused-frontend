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

    // Generate all content types in one comprehensive call
    const concepts = ['leverage', 'pruning', 'clarity', 'momentum', 'consolidation', 'synthesis', 'distillation', 'resonance', 'calibration', 'emergence'];
    const randomConcept = concepts[Math.floor(Math.random() * concepts.length)];
    
    const challenges = [
      're-engaging after a distraction',
      'the Sunday scaries',
      'mental fatigue from video calls',
      'organizing digital files',
      'maintaining energy in the afternoon',
      'staying focused in open offices',
      'managing notification overload',
      'transitioning between different types of work'
    ];
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    
    const fields = [
      'library science',
      'supply chain logistics',
      'video game design',
      'cinematography',
      'orchestra conducting',
      'surgical procedures',
      'forensic investigation',
      'botanical research',
      'architectural planning',
      'wildlife photography'
    ];
    const randomField = fields[Math.floor(Math.random() * fields.length)];
    
    const vocabularyDomains = ['Psychology', 'Philosophy', 'Architecture', 'Music Theory', 'Linguistics', 'Astronomy', 'Botany', 'Geology'];
    const randomDomain = vocabularyDomains[Math.floor(Math.random() * vocabularyDomains.length)];
    
    const sensoryFocus = [
      'the texture of the object closest to you',
      'the ambient sounds in the room',
      'the feeling of gravity on your body',
      'the taste of water',
      'the temperature of the air on your skin',
      'the weight of your clothing',
      'the rhythm of your heartbeat',
      'the sensation of your feet touching the ground'
    ];
    const randomSensory = sensoryFocus[Math.floor(Math.random() * sensoryFocus.length)];

    const fullPrompt = `Generate comprehensive Mind Fuel content with all 5 sections:

1. Daily Focus: A motivational phrase (5-8 words) centered on the concept of ${randomConcept}
2. Tip of the Day: An uncommon productivity tip (15-20 words) addressing ${randomChallenge}
3. Productivity Hack: An unconventional technique (20-25 words) inspired by ${randomField}
4. Brain Boost: A vocabulary word from ${randomDomain} with brief definition (8-12 words max)
5. Mindfulness Moment: A sensory exercise (15-25 words) focused on ${randomSensory}

CRITICAL: Your response must be ONLY a valid JSON object in exactly this format:
{
  "weeklyFocus": {
    "focus": "your daily focus phrase"
  },
  "tipOfTheDay": {
    "tip": "your tip"
  },
  "productivityHack": {
    "hack": "your productivity hack"
  },
  "brainBoost": {
    "word": "vocabulary word",
    "definition": "brief definition"
  },
  "mindfulnessMoment": {
    "moment": "your mindfulness exercise"
  }
}

Do not include any other text, explanations, or formatting. Just the JSON object.`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: fullPrompt
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