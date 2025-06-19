import client from '../client';
import { STUDY } from '../endpoints';

interface Card {
  id?: string | number;
  front_content: string;
  back_content: string;
}

interface StudySet {
  id?: string | number;
  title: string;
  cards: Card[];
}

interface StudySetResponse {
  id: number;
  title: string;
  cards: Card[];
  user_id: number;
  created_at: string;
  updated_at: string;
}

/**
 * Study Service
 * Handles all study-related API calls with consistent error handling
 */
export const studyService = {
  /**
   * Get all study sets for current user
   */
  async getStudySets() {
    try {
      const response = await client.get<StudySetResponse[]>(STUDY.SETS);
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${STUDY.SETS}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to load study sets from server.'
        : 'Failed to load study sets from server.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Create a new study set
   */
  async createStudySet(studySet: StudySet) {
    try {
      const response = await client.post<StudySetResponse>(STUDY.SETS, studySet);
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${STUDY.SETS}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to create study set.'
        : 'Failed to create study set.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Update an existing study set
   */
  async updateStudySet(id: string | number, studySet: Partial<StudySet>) {
    try {
      const endpoint = STUDY.SET_DETAIL(id);
      const response = await client.put<StudySetResponse>(endpoint, studySet);
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${STUDY.SET_DETAIL(id)}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to update study set.'
        : 'Failed to update study set.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Delete a study set
   */
  async deleteStudySet(id: string | number) {
    try {
      const endpoint = STUDY.SET_DETAIL(id);
      const response = await client.delete(endpoint);
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${STUDY.SET_DETAIL(id)}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to delete study set.'
        : 'Failed to delete study set.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Add a card to a study set
   */
  async addCard(setId: string | number, card: Card) {
    try {
      const endpoint = STUDY.CARDS(setId);
      const response = await client.post(endpoint, card);
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${STUDY.CARDS(setId)}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to add card to study set.'
        : 'Failed to add card to study set.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Delete a card from a study set
   */
  async deleteCard(setId: string | number, cardId: string | number) {
    try {
      const endpoint = STUDY.CARD_DETAIL(setId, cardId);
      const response = await client.delete(endpoint);
      return response.data;
    } catch (error: unknown) {
      console.error(`API Error [${STUDY.CARD_DETAIL(setId, cardId)}]:`, error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to delete card from study set.'
        : 'Failed to delete card from study set.';
      throw new Error(errorMessage);
    }
  }
}; 