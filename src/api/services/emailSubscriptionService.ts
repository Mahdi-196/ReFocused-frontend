import client from '@/api/client';
import { EMAIL } from '@/api/endpoints';

export interface SubscribeResponse {
  success?: boolean;
  message?: string;
  status?: string;
  email?: string;
  subscribed_at?: string;
  subscription_id?: number;
}

export interface UnsubscribeResponse {
  success?: boolean;
  message?: string;
  status?: string;
  email?: string;
  unsubscribed_at?: string;
}

export const emailSubscriptionService = {
  async status(email: string): Promise<{ success?: boolean; isSubscribed?: boolean; email?: string } & Record<string, unknown>> {
    const response = await client.post(EMAIL.STATUS, { email });
    return response.data;
  },
  async subscribe(email: string, options?: Partial<{ source: string; referrer: string; utm_source: string; utm_medium: string; utm_campaign: string }>): Promise<SubscribeResponse> {
    const payload = { email, ...(options || {}) };
    const response = await client.post(EMAIL.SUBSCRIBE, payload);
    return response.data;
  },

  async unsubscribe(email: string): Promise<UnsubscribeResponse> {
    const response = await client.post(EMAIL.UNSUBSCRIBE, { email });
    return response.data;
  },
};

export default emailSubscriptionService;


