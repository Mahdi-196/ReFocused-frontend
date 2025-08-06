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
    const { dataType, customPrompt, count = 1 } = body;

    if (!dataType) {
      return NextResponse.json(
        { error: 'Data type is required' },
        { status: 400 }
      );
    }

    // Helper function to generate single item with randomized seed
    const generateSingleItem = async (dataType: string) => {
      let prompt = '';
      
      switch (dataType) {
        case 'journal-prompts':
          const journalThemes = [
            'the feeling of nostalgia',
            'a difficult decision you\'re proud of', 
            'your relationship with technology',
            'a moment when you felt truly understood',
            'the concept of home and belonging',
            'a skill you wish you had',
            'your relationship with failure',
            'the role of rituals in your life',
            'a person who changed your perspective',
            'your relationship with time'
          ];
          const randomJournalTheme = journalThemes[Math.floor(Math.random() * journalThemes.length)];
          prompt = `Generate one thoughtful journal prompt about ${randomJournalTheme}. Format as JSON: {"prompt": "your question"}`;
          break;

        case 'goals':
          const goalCategories = [
            'Intellectual Curiosity',
            'Physical Vitality', 
            'Creative Expression',
            'Emotional Intelligence',
            'Social Connection',
            'Professional Growth',
            'Spiritual Development',
            'Financial Wellness',
            'Environmental Stewardship',
            'Community Contribution'
          ];
          const randomCategory = goalCategories[Math.floor(Math.random() * goalCategories.length)];
          prompt = `Generate one personal development goal related to the category of '${randomCategory}'. Provide a title for the goal and a concrete first step. Format as JSON: {"title": "goal title", "category": "${randomCategory}", "description": "brief description", "first_step": "actionable first step"}`;
          break;

        case 'affirmations':
          const affirmationMetaphors = [
            'gardening',
            'sailing', 
            'building with stone',
            'weaving a tapestry',
            'sculpting marble',
            'conducting an orchestra',
            'tending a fire',
            'navigating by stars'
          ];
          const randomMetaphor = affirmationMetaphors[Math.floor(Math.random() * affirmationMetaphors.length)];
          prompt = `Generate one positive, empowering affirmation. The affirmation should use a metaphor related to ${randomMetaphor}. Format as JSON: {"affirmation": "your affirmation", "category": "relevant category"}`;
          break;

        case 'habits':
          const habitDomains = [
            'morning energy optimization',
            'cognitive load management',
            'digital boundary setting',
            'creative practice',
            'physical grounding',
            'social connection',
            'evening wind-down',
            'nutritional mindfulness'
          ];
          const randomDomain = habitDomains[Math.floor(Math.random() * habitDomains.length)];
          prompt = `Generate one healthy habit focused on ${randomDomain}. Provide a name, description, and suggested frequency. Format as JSON: {"name": "habit name", "description": "brief description", "frequency": "how often", "category": "relevant category"}`;
          break;

        case 'meditation-sessions':
          const meditationFocus = [
            'Stress Relief',
            'Enhanced Focus',
            'Better Sleep', 
            'Self-Compassion',
            'Anxiety Relief',
            'Gratitude Practice',
            'Body Awareness',
            'Emotional Balance',
            'Mind Clearing',
            'Energy Restoration'
          ];
          const randomFocus = meditationFocus[Math.floor(Math.random() * meditationFocus.length)];
          const durations = ['5 minutes', '10 minutes', '15 minutes', '20 minutes'];
          const randomDuration = durations[Math.floor(Math.random() * durations.length)];
          prompt = `Generate one guided meditation session for ${randomFocus}. Duration should be ${randomDuration}. Provide title, description, and brief instructions. Format as JSON: {"title": "session title", "description": "brief description", "duration": "${randomDuration}", "focus": "${randomFocus}", "instructions": "meditation guidance"}`;
          break;

        case 'custom':
          prompt = customPrompt || 'Generate creative content based on the user\'s needs.';
          break;

        default:
          throw new Error('Invalid data type');
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          temperature: 0.7,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    };

    // Generate items one by one in a loop for maximum variety
    const results = [];
    for (let i = 0; i < count; i++) {
      try {
        const result = await generateSingleItem(dataType);
        results.push(result);
      } catch (error) {
        console.error(`Error generating item ${i + 1}:`, error);
        // Continue with other items even if one fails
      }
    }

    return NextResponse.json({
      content: results,
      metadata: {
        dataType,
        count: results.length,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error calling Claude API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}