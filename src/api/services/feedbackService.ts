import client from '@/api/client';
import { FEEDBACK } from '@/api/endpoints';

export interface FeedbackRequest {
  rating: number; // 1-5
  category: string;
  message: string;
  email?: string;
}

export interface FeedbackResponse {
  status?: string;
  feedbackId?: string;
  message?: string;
}

export const feedbackService = {
  async submit(body: FeedbackRequest): Promise<FeedbackResponse> {
    const payload: FeedbackRequest = {
      rating: Math.max(1, Math.min(5, Math.round(body.rating))),
      category: body.category?.trim() || '',
      message: body.message?.trim() || '',
      email: body.email?.trim() || undefined,
    };

    const res = await client.post<FeedbackResponse>(FEEDBACK.SUBMIT, payload, {
      validateStatus: () => true, // handle 4xx (e.g., 429) manually
    });

    if (res.status === 429) {
      const header = (res.headers['retry-after'] as string) || (res.headers['Retry-After'] as unknown as string) || '60';
      const seconds = parseInt(header, 10);
      const err: any = new Error('Rate limited');
      err.status = 429;
      err.retryAfter = Number.isFinite(seconds) ? seconds : 60;
      throw err;
    }

    if (res.status < 200 || res.status >= 300) {
      const detail = (res.data as any)?.message || (res.data as any)?.error || 'Feedback failed';
      const err: any = new Error(detail);
      err.status = res.status;
      throw err;
    }

    return res.data || { status: 'ok' };
  },
};


