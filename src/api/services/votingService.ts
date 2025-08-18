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
    const response = await client.get<VotingStatsResponse>(VOTING.STATS);
    return response.data;
  },
};


