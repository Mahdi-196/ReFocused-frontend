import client from '@/api/client';
import { USER } from '@/api/endpoints';

export interface TutorialStatus {
  signupCompleted: boolean;
  googleCompleted: boolean;
}

export type TutorialMethod = 'signup' | 'google';

export const tutorialService = {
  async getStatus(): Promise<TutorialStatus> {
    const resp = await client.get<TutorialStatus>(USER.TUTORIAL, { withCredentials: true });
    return resp.data;
  },

  async markCompleted(method: TutorialMethod): Promise<TutorialStatus> {
    const resp = await client.post<TutorialStatus>(USER.TUTORIAL, { method }, { withCredentials: true });
    return resp.data;
  },
};


