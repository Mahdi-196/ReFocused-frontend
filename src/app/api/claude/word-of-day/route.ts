import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache to prevent recent repetitions
let recentWords: string[] = [];
const MAX_RECENT_WORDS = 20;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.CLAUDE_API_TESTING_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      );
    }

    // Domain-specific word generation for variety
    const domains = [
      'Geology',
      'Astronomy',
      'Music Theory',
      'Philosophy',
      'Nautical Terms',
      'Architecture',
      'Botany',
      'Anatomy',
      'Mythology',
      'Rhetoric',
      'Psychology',
      'Meteorology',
      'Archaeology',
      'Linguistics',
      'Culinary Arts',
      'Textile Arts',
      'Optics',
      'Cartography'
    ];

    // Helper function to try generating a word from a specific domain
    const tryGenerateWord = async (domain: string) => {
      const dynamicPrompt = `Generate a single, interesting vocabulary word suitable for learning.

The word must be sourced from the domain of ${domain}.
It must be a word that is uncommon but still useful.
Do not use the word "ephemeral" or any of its common synonyms.
${recentWords.length > 0 ? `\nIMPORTANT: Do not use any of these recently generated words: ${recentWords.join(', ')}` : ''}

CRITICAL: Your response must be ONLY a valid JSON object in exactly this format:
{
  "word": "the vocabulary word",
  "pronunciation": "/phonetic-pronunciation/",
  "definition": "concise definition (6-10 words)",
  "example": "engaging example sentence (10-15 words)"
}

Do not include any other text, explanations, or formatting. Just the JSON object.

Example response format:
{
  "word": "petrichor",
  "pronunciation": "/ˈpe-trə-ˌkȯr/",
  "definition": "pleasant smell of earth after rain",
  "example": "The petrichor filled the air after the summer thunderstorm passed."
}`;

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
          temperature: 0.8,
          messages: [
            {
              role: 'user',
              content: dynamicPrompt
            }
          ]
        })
      });

      if (!claudeResponse.ok) {
        throw new Error(`Claude API request failed: ${claudeResponse.status}`);
      }

      const data = await claudeResponse.json();
      
      // Validate that we got a proper response with word content
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response format from Claude API');
      }

      // Try to parse the JSON response
      try {
        console.log(`Raw Claude response for ${domain}:`, data.content[0].text);
        const wordData = JSON.parse(data.content[0].text);
        console.log(`Parsed word data from ${domain}:`, wordData);
        
        if (!wordData.word || !wordData.pronunciation || !wordData.definition || !wordData.example) {
          console.log(`Missing fields from ${domain} - word:`, !!wordData.word, 'pronunciation:', !!wordData.pronunciation, 'definition:', !!wordData.definition, 'example:', !!wordData.example);
          throw new Error('Word response missing required fields');
        }
        
        // Check if this word was recently generated
        if (recentWords.includes(wordData.word.toLowerCase())) {
          console.log(`🔄 Word "${wordData.word}" was recently generated, trying different domain...`);
          throw new Error(`Word "${wordData.word}" was recently generated`);
        }
        
        // Add to recent words cache
        recentWords.push(wordData.word.toLowerCase());
        if (recentWords.length > MAX_RECENT_WORDS) {
          recentWords.shift(); // Remove oldest word
        }
        
        console.log(`✅ Successfully generated new word from ${domain}: "${wordData.word}"`);
        console.log(`📝 Recent words cache now contains: ${recentWords.length} words`);
        return data;
      } catch (parseError) {
        console.log(`JSON parse error for ${domain}:`, parseError);
        console.log(`Raw text that failed to parse from ${domain}:`, data.content[0].text);
        throw new Error('Failed to parse word JSON response');
      }
    };

    // Try up to 3 different domains/attempts
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // Select a random domain for this attempt
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        console.log(`📚 Word attempt ${attempt + 1}: Trying ${randomDomain} domain`);
        
        const result = await tryGenerateWord(randomDomain);
        console.log(`✅ Word success: Got word from ${randomDomain} domain`);
        return NextResponse.json(result);
        
      } catch (error) {
        lastError = error;
        console.log(`❌ Word attempt ${attempt + 1} failed:`, error instanceof Error ? error.message : 'Unknown error');
        
        // If this is the last attempt, we'll fall through to the error response
        if (attempt < 2) {
          // Wait a brief moment before trying again
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // All attempts failed
    console.error('❌ All 3 word generation attempts failed. Last error:', lastError);
    return NextResponse.json(
      { error: 'Failed to generate word after 3 attempts', details: lastError instanceof Error ? lastError.message : 'Unknown error' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Error calling Claude API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}