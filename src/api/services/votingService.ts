import client from '@/api/client';
import { VOTING } from '@/api/endpoints';

export type PredefinedFeatureKey = 'develop-ai' | 'collaboration' | 'gamification-system';

export interface VoteRequestBody {
  feature?: PredefinedFeatureKey;
  custom?: string;
}

export interface VoteResponse {
  success: boolean;
  message?: string;
}

export interface VotingStatsItem {
  key: PredefinedFeatureKey | string;
  votes: number;
}

export interface VotingStatsResponse {
  total: number;
  items: VotingStatsItem[];
}

export interface VotingMeResponse {
  voted: boolean;
}

/**
 * Voting API Service
 * Calls backend endpoints which forward to AWS API Gateway.
 */
export const votingService = {
  async submitVote(payload: VoteRequestBody): Promise<VoteResponse> {
    // Trim custom text and enforce 600 max per backend behavior. Frontend UI may use 500.
    const body: VoteRequestBody = payload.custom
      ? { custom: payload.custom.trim().slice(0, 600) }
      : { feature: payload.feature };

    const response = await client.post<VoteResponse>(VOTING.VOTE, body);
    return response.data || { success: true };
  },

  async getStats(): Promise<VotingStatsResponse> {
    try {
      const response = await client.get<VotingStatsResponse>(VOTING.STATS);
      return response.data;
    } catch (error) {
      // Silence UI-facing errors; let caller decide how to render
      console.error('Failed to fetch voting stats:', error);
      return { total: 0, items: [] };
    }
  },

  async hasVoted(): Promise<boolean> {
    try {
      const response = await client.get<VotingMeResponse>(VOTING.ME, { validateStatus: () => true });
      if (response.status >= 200 && response.status < 300) {
        return Boolean((response.data as VotingMeResponse)?.voted);
      }
      // Fallback: treat 409 as already voted
      if (response.status === 409) return true;
      return false;
    } catch (error) {
      console.error('Failed to check voting status:', error);
      return false;
    }
  },
};


