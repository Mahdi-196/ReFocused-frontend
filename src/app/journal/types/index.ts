export type Entry = {
  id: string;
  title: string;
  content: string;
  collection_id: number; // Backend uses integer collection_id
  is_encrypted?: boolean; // Backend uses snake_case
  created_at?: string; // Backend uses snake_case
  updated_at?: string; // Backend uses snake_case
  // Keep frontend-friendly aliases for backward compatibility
  createdAt?: string;
  lastSavedAt?: string;
  updatedAt?: string;
  isEncrypted?: boolean;
};

export type Collection = {
  id: number; // Backend uses integer IDs
  name: string;
  is_private?: boolean; // Backend uses snake_case
  user_id?: number; // Backend field
  created_at?: string; // Backend uses snake_case
  updated_at?: string; // Backend uses snake_case
  entry_count?: number; // Backend field
  entries: Entry[];
  // Keep frontend-friendly aliases for backward compatibility
  isPrivate?: boolean;
  createdAt?: string;
  updatedAt?: string;
  entryCount?: number;
};

export type GratitudeEntry = {
  id: number;
  text: string;
  date: string;
  user_id?: number; // Backend field
  created_at?: string; // Backend uses snake_case
  // Keep frontend-friendly aliases for backward compatibility
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

// API Request Types (Backend format)
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
  new_password?: string;
};

export type CreateEntryRequest = {
  title: string;
  content: string;
  collection_id: number;
  is_encrypted?: boolean;
};

export type UpdateEntryRequest = {
  title?: string;
  content?: string;
  is_encrypted?: boolean;
};

export type CreateGratitudeRequest = {
  text: string;
  date?: string;
};

export type UpdateGratitudeRequest = {
  text: string;
};

// API Response Types (Backend format)
export type CollectionResponse = {
  id: number;
  name: string;
  is_private: boolean;
  user_id: number;
  created_at: string;
  updated_at: string;
  entry_count: number;
};

export type EntryResponse = {
  id: string;
  title: string;
  content: string;
  collection_id: number;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
};

export type GratitudeResponse = {
  id: number;
  text: string;
  date: string;
  user_id: number;
  created_at: string;
};

// Paginated Response Types (Backend format)
export type PaginatedCollectionsResponse = {
  collections: CollectionResponse[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
  has_prev: boolean;
};

export type PaginatedEntriesResponse = {
  entries: EntryResponse[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
  has_prev: boolean;
};

export type PaginatedGratitudeResponse = {
  gratitude_entries: GratitudeResponse[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
  has_prev: boolean;
};

// Password Verification Response
export type PasswordVerificationResponse = {
  valid: boolean;
  access_token?: string;
  expires_in?: number;
  collection_id?: number;
};

// Statistics Response
export type JournalStatsResponse = {
  total_collections: number;
  total_entries: number;
  total_gratitude: number;
  private_collections: number;
  entries_this_week: number;
  entries_this_month: number;
  gratitude_this_week: number;
  gratitude_streak: number;
};

export type JournalApiError = {
  message: string;
  code: string;
  details?: any;
}; 