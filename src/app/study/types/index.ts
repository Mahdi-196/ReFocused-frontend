export type Card = {
  id: string;
  front: string;
  back: string;
};

export type StudySet = {
  id: string;
  name: string;
  cards: Card[];
  user_id?: string | number;
  last_updated?: string;
};

export type ModalType = 'newSet' | 'editSet' | 'addCard' | 'deleteCard' | 'deleteSet' | null;

export type TimeFilter = 'D' | 'W' | 'M';

export type Statistics = {
  focusTime: number;
  sessions: number;
  tasksDone: number;
}; 