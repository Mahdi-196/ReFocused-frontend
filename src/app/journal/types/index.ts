export type Entry = {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
  lastSavedAt?: string;
  updatedAt?: string;
  isEncrypted?: boolean;
};

export type Collection = {
  id: string;
  name: string;
  isPrivate?: boolean;
  entries: Entry[];
  createdAt?: string;
  updatedAt?: string;
  entryCount?: number;
};

export type GratitudeEntry = {
  id: number;
  text: string;
  date: string;
  createdAt?: string;
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
  collection?: Collection | null;
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

// API Request/Response Types
export type CreateCollectionRequest = {
  name: string;
  is_private?: boolean;
  password?: string;
};

export type UpdateCollectionRequest = {
  name?: string;
  is_private?: boolean;
  password?: string;
  current_password?: string;
};

export type CreateEntryRequest = {
  title: string;
  content: string;
  collection_id: number; // ✅ Fixed: integer for backend  
  is_encrypted?: boolean; // ✅ Fixed: snake_case for backend
};

export type UpdateEntryRequest = {
  title?: string;
  content?: string;
  is_encrypted?: boolean; // ✅ Fixed: snake_case for backend
};

export type CollectionResponse = {
  id: string;
  name: string;
  isPrivate: boolean;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
};

export type EntryResponse = {
  id: string;
  title: string;
  content: string;
  collectionId: string;
  isEncrypted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type JournalApiError = {
  message: string;
  code: string;
  details?: any;
}; 