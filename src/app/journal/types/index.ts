export type Entry = {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
  lastSavedAt?: string;
};

export type Collection = {
  id: string;
  name: string;
  isPrivate?: boolean;
  entries: Entry[];
};

export type GratitudeEntry = {
  id: number;
  text: string;
  date: string;
};

export type DeleteConfirmation = {
  type: 'entry' | 'collection';
  id: string;
  name?: string;
};

export type DropdownState = {
  type: 'entry' | 'collection';
  id: string;
  rect: DOMRect | null;
  collection?: Collection;
  entry?: Entry;
};

export type PasswordPrompt = {
  collectionId: string;
  name: string;
};

export type CollectionFormData = {
  name: string;
  isPrivate: boolean;
  password: string;
  currentPassword: string;
}; 