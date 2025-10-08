interface QuoteResponse {
  text: string;
  author: string;
}

interface WordResponse {
  word: string;
  pronunciation: string;
  definition: string;
  example: string;
}

interface MindFuelResponse {
  weeklyFocus: {
    focus: string;
  };
  tipOfTheDay: {
    tip: string;
  };
  productivityHack: {
    hack: string;
  };
  brainBoost: {
    word: string;
    definition: string;
  };
  mindfulnessMoment: {
    moment: string;
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  response: string;
  messages_remaining: number;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface PopulateDataResponse {
  data_type: string;
  count: number;
  content: Array<{
    id: string;
    prompt?: string;
    goal?: string;
    affirmation?: string;
    habit?: string;
    session?: string;
    generated_at: string;
  }>;
}

interface WritingPromptsResponse {
  prompts: string[];
}

interface AiSuggestion {
  title: string;
  category: string;
  prompt: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

interface AiSuggestionsResponse {
  suggestions: AiSuggestion[];
}

class ApiService {
  private getBaseUrl(): string {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    return base.replace(/\/$/, '');
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('REF_TOKEN') : null;

    const url = `${this.getBaseUrl()}/v1/ai/${endpoint.replace(/^\//, '')}`;

    const response = await fetch(url, {
      method: options.method || 'GET',
      credentials: 'include', // Send cookies with cross-origin requests
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Try to extract structured error; fallback to text
      let message = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        message = errorData?.error || errorData?.detail || message;
      } catch {
        try {
          const text = await response.text();
          if (text) message = text;
        } catch {}
      }
      const error: any = new Error(message);
      error.status = response.status;
      const retryAfter = response.headers.get('Retry-After');
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (Number.isFinite(seconds)) error.retryAfter = seconds;
      }

      // Fire global rate-limit event for fetch-based paths as well
      if (response.status === 429 && typeof window !== 'undefined') {
        try {
          window.dispatchEvent(
            new CustomEvent('rateLimit', {
              detail: { retryAfter: error.retryAfter, path: endpoint },
            })
          );
        } catch {}
      }

      throw error;
    }

    return response.json();
  }

  async fetchQuoteOfDay(): Promise<QuoteResponse> {
    return this.makeRequest<QuoteResponse>('quote-of-day');
  }

  async fetchWordOfDay(): Promise<WordResponse> {
    return this.makeRequest<WordResponse>('word-of-day');
  }

  async fetchMindFuel(): Promise<MindFuelResponse> {
    return this.makeRequest<MindFuelResponse>('mind-fuel');
  }

  async sendChatMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    systemPrompt?: string
  ): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>('chat', {
      method: 'POST',
      body: JSON.stringify({ message, systemPrompt, conversationHistory })
    });
  }

  async populateData(
    dataType: 'journal-prompts' | 'goals' | 'affirmations' | 'habits' | 'meditation-sessions',
    count: number = 5,
    customPrompt?: string
  ): Promise<PopulateDataResponse> {
    return this.makeRequest<PopulateDataResponse>('populate-data', {
      method: 'POST',
      body: JSON.stringify({ dataType, count, ...(customPrompt && { customPrompt }) })
    });
  }

  async fetchWritingPrompts(refresh: boolean = false): Promise<WritingPromptsResponse> {
    const endpoint = refresh ? 'writing-prompts?refresh=true' : 'writing-prompts';
    return this.makeRequest<WritingPromptsResponse>(endpoint, { method: 'POST' });
  }

  async fetchAiSuggestions(): Promise<AiSuggestionsResponse> {
    return this.makeRequest<AiSuggestionsResponse>('ai-suggestions', { method: 'POST' });
  }
}

export const apiService = new ApiService();
export type { 
  QuoteResponse, 
  WordResponse, 
  MindFuelResponse, 
  ChatMessage, 
  ChatResponse, 
  PopulateDataResponse,
  WritingPromptsResponse,
  AiSuggestion,
  AiSuggestionsResponse
};