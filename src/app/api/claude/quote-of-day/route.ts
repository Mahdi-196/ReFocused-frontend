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

    // List of famous historical figures
    const famousPeople = [
      'Albert Einstein', 'William Shakespeare', 'Leonardo da Vinci', 'Isaac Newton', 'Charles Darwin',
      'Galileo Galilei', 'Nikola Tesla', 'Marie Curie', 'Louis Pasteur', 'Stephen Hawking',
      'Aristotle', 'Plato', 'Socrates', 'Confucius', 'Lao Tzu', 'Sun Tzu', 'René Descartes',
      'Voltaire', 'John Locke', 'Jean-Jacques Rousseau', 'Immanuel Kant', 'Friedrich Nietzsche',
      'Karl Marx', 'Adam Smith', 'Machiavelli', 'Søren Kierkegaard', 'Simone de Beauvoir',
      'Ayn Rand', 'Noam Chomsky', 'Martin Luther King Jr.', 'Mahatma Gandhi', 'Nelson Mandela',
      'Abraham Lincoln', 'George Washington', 'Thomas Jefferson', 'Winston Churchill',
      'Franklin D. Roosevelt', 'Theodore Roosevelt', 'John F. Kennedy', 'Queen Elizabeth I',
      'Julius Caesar', 'Alexander the Great', 'Napoleon Bonaparte', 'Marcus Aurelius',
      'Mark Twain', 'Ernest Hemingway', 'George Orwell', 'Maya Angelou', 'Oscar Wilde',
      'Virginia Woolf', 'Jane Austen', 'Leo Tolstoy', 'Fyodor Dostoevsky', 'Walt Whitman',
      'Emily Dickinson', 'Robert Frost', 'T.S. Eliot', 'Pablo Picasso', 'Vincent van Gogh',
      'Michelangelo', 'Leonardo da Vinci', 'Claude Monet', 'Salvador Dalí', 'Frida Kahlo',
      'Wolfgang Amadeus Mozart', 'Ludwig van Beethoven', 'Johann Sebastian Bach', 'Elvis Presley',
      'Bob Dylan', 'The Beatles', 'Frank Sinatra', 'Louis Armstrong', 'Duke Ellington',
      'Mother Teresa', 'The Dalai Lama', 'Jesus Christ', 'Buddha', 'Prophet Muhammad',
      'Steve Jobs', 'Bill Gates', 'Henry Ford', 'Thomas Edison', 'Alexander Graham Bell',
      'Walt Disney', 'Oprah Winfrey', 'Eleanor Roosevelt', 'Frederick Douglass', 'Rosa Parks',
      'Susan B. Anthony', 'Harriet Tubman', 'Benjamin Franklin', 'Ralph Waldo Emerson',
      'Henry David Thoreau', 'John Muir', 'Rachel Carson', 'Jane Goodall', 'Charles Dickens',
      'J.K. Rowling', 'Stephen King', 'Agatha Christie', 'Arthur Conan Doyle', 'George Bernard Shaw',
      'Tennessee Williams', 'Arthur Miller', 'Babe Ruth', 'Muhammad Ali', 'Michael Jordan',
      'Serena Williams', 'Tiger Woods', 'Pelé', 'Jackie Robinson', 'Jesse Owens',
      'Vince Lombardi', 'John Wooden', 'Carl Jung', 'Sigmund Freud', 'Viktor Frankl',
      'Abraham Maslow', 'Martin Scorsese', 'Steven Spielberg', 'Alfred Hitchcock', 'Orson Welles',
      'Charlie Chaplin', 'Marilyn Monroe', 'Audrey Hepburn', 'Marlon Brando', 'James Dean'
    ];

    // Helper function to try generating a quote from a specific person
    const tryGenerateQuote = async (person: string) => {
      const dynamicPrompt = `Find a well-known, authentic quote by ${person} that relates to wisdom, productivity, self-help, personal growth, or motivation.

Requirements:
- Use a real, documented quote that ${person} is known to have said or written
- Focus on themes of wisdom, productivity, self-help, personal development, success, growth, or motivation
- Quote should be 10-30 words for good UI display

CRITICAL: Your response must be ONLY a valid JSON object in exactly this format:
{
  "text": "the actual quote text here",
  "author": "${person}"
}

Do not include any other text, explanations, or formatting. Just the JSON object.

Example response format:
{
  "text": "Try not to become a person of success, but rather try to become a person of value.",
  "author": "Albert Einstein"
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
          temperature: 0.7,
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
      
      // Validate that we got a proper response with quote content
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response format from Claude API');
      }

      // Try to parse the JSON response
      try {
        console.log('Raw Claude response:', data.content[0].text);
        const quoteData = JSON.parse(data.content[0].text);
        console.log('Parsed quote data:', quoteData);
        
        if (!quoteData.text || !quoteData.author) {
          console.log('Missing fields - text:', !!quoteData.text, 'author:', !!quoteData.author);
          throw new Error('Quote response missing required fields');
        }
        return data;
      } catch (parseError) {
        console.log('JSON parse error:', parseError);
        console.log('Raw text that failed to parse:', data.content[0].text);
        throw new Error('Failed to parse quote JSON response');
      }
    };

    // Try up to 3 different people/attempts
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // Select a random person for this attempt
        const randomPerson = famousPeople[Math.floor(Math.random() * famousPeople.length)];
        console.log(`Attempt ${attempt + 1}: Trying to get quote from ${randomPerson}`);
        
        const result = await tryGenerateQuote(randomPerson);
        console.log(`Success: Got quote from ${randomPerson}`);
        return NextResponse.json(result);
        
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt + 1} failed:`, error instanceof Error ? error.message : 'Unknown error');
        
        // If this is the last attempt, we'll fall through to the error response
        if (attempt < 2) {
          // Wait a brief moment before trying again
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // All attempts failed
    console.error('All 3 attempts failed. Last error:', lastError);
    return NextResponse.json(
      { error: 'Failed to generate quote after 3 attempts', details: lastError instanceof Error ? lastError.message : 'Unknown error' },
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