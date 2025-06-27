import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import journalService from '../../../api/services/journalService';
import client from '../../../api/client';
import { JOURNAL } from '../../../api/endpoints';

// Mock the API client
vi.mock('../../../api/client');
const mockClient = vi.mocked(client);

describe('JournalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Collection Operations', () => {
    it('should fetch collections successfully', async () => {
      const mockCollections = [
        {
          id: '1',
          name: 'My Notes',
          isPrivate: false,
          entryCount: 5,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];

      mockClient.get.mockResolvedValueOnce({ data: mockCollections });

      const result = await journalService.getCollections();

      expect(mockClient.get).toHaveBeenCalledWith(JOURNAL.COLLECTIONS);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'My Notes',
        isPrivate: false,
        entries: [],
      });
    });

    it('should create a new collection', async () => {
      const newCollection = {
        name: 'Test Collection',
        isPrivate: false,
      };

      const mockResponse = {
        id: '2',
        name: 'Test Collection',
        isPrivate: false,
        entryCount: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await journalService.createCollection(newCollection);

      expect(mockClient.post).toHaveBeenCalledWith(JOURNAL.COLLECTIONS, newCollection);
      expect(result.name).toBe('Test Collection');
    });

    it('should verify collection password', async () => {
      const collectionId = '1';
      const password = 'test123';

      mockClient.post.mockResolvedValueOnce({ data: { valid: true } });

      const result = await journalService.verifyCollectionPassword(collectionId, password);

      expect(mockClient.post).toHaveBeenCalledWith(
        JOURNAL.COLLECTION_VERIFY_PASSWORD(collectionId),
        { password }
      );
      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      const collectionId = '1';
      const password = 'wrong';

      const error = new Error('Unauthorized');
      error.status = 401;
      mockClient.post.mockRejectedValueOnce(error);

      const result = await journalService.verifyCollectionPassword(collectionId, password);

      expect(result).toBe(false);
    });

    it('should delete a collection', async () => {
      const collectionId = '1';

      mockClient.delete.mockResolvedValueOnce({});

      await journalService.deleteCollection(collectionId);

      expect(mockClient.delete).toHaveBeenCalledWith(JOURNAL.COLLECTION_DETAIL(collectionId));
    });
  });

  describe('Entry Operations', () => {
    it('should create a new entry', async () => {
      const newEntry = {
        title: 'Test Entry',
        content: 'This is a test entry',
        collectionId: '1',
        isEncrypted: false,
      };

      const mockResponse = {
        id: 'entry-1',
        title: 'Test Entry',
        content: 'This is a test entry',
        collectionId: '1',
        isEncrypted: false,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await journalService.createEntry(newEntry);

      expect(mockClient.post).toHaveBeenCalledWith(JOURNAL.ENTRIES, newEntry);
      expect(result.title).toBe('Test Entry');
      expect(result.content).toBe('This is a test entry');
    });

    it('should update an existing entry', async () => {
      const entryId = 'entry-1';
      const updates = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      const mockResponse = {
        id: entryId,
        title: 'Updated Title',
        content: 'Updated content',
        collectionId: '1',
        isEncrypted: false,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T01:00:00Z',
      };

      mockClient.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await journalService.updateEntry(entryId, updates);

      expect(mockClient.put).toHaveBeenCalledWith(JOURNAL.ENTRY_DETAIL(entryId), updates);
      expect(result.title).toBe('Updated Title');
    });

    it('should fetch entries for a collection', async () => {
      const collectionId = '1';
      const mockEntries = [
        {
          id: 'entry-1',
          title: 'Entry 1',
          content: 'Content 1',
          collectionId,
          isEncrypted: false,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];

      mockClient.get.mockResolvedValueOnce({ data: mockEntries });

      const result = await journalService.getEntries(collectionId);

      expect(mockClient.get).toHaveBeenCalledWith(JOURNAL.COLLECTION_ENTRIES(collectionId));
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Entry 1');
    });

    it('should delete an entry', async () => {
      const entryId = 'entry-1';

      mockClient.delete.mockResolvedValueOnce({});

      await journalService.deleteEntry(entryId);

      expect(mockClient.delete).toHaveBeenCalledWith(JOURNAL.ENTRY_DETAIL(entryId));
    });
  });

  describe('Gratitude Operations', () => {
    it('should fetch gratitudes', async () => {
      const mockGratitudes = [
        {
          id: 1,
          text: 'Grateful for sunny weather',
          date: '2023-01-01',
          createdAt: '2023-01-01T00:00:00Z',
        },
      ];

      mockClient.get.mockResolvedValueOnce({ data: mockGratitudes });

      const result = await journalService.getGratitudes();

      expect(mockClient.get).toHaveBeenCalledWith(JOURNAL.GRATITUDE);
      expect(result).toEqual(mockGratitudes);
    });

    it('should create a gratitude entry', async () => {
      const gratitudeText = 'Grateful for good health';
      const mockResponse = {
        id: 2,
        text: gratitudeText,
        date: '2023-01-01',
        createdAt: '2023-01-01T00:00:00Z',
      };

      mockClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await journalService.createGratitude(gratitudeText);

      expect(mockClient.post).toHaveBeenCalledWith(JOURNAL.GRATITUDE, {
        text: gratitudeText,
        date: expect.any(String),
      });
      expect(result.text).toBe(gratitudeText);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors properly', async () => {
      const networkError = new Error('Network Error');
      networkError.isNetworkError = true;
      mockClient.get.mockRejectedValueOnce(networkError);

      await expect(journalService.getCollections()).rejects.toMatchObject({
        message: 'Network connection failed',
        code: 'NETWORK_ERROR',
      });
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.isTimeout = true;
      mockClient.get.mockRejectedValueOnce(timeoutError);

      await expect(journalService.getCollections()).rejects.toMatchObject({
        message: 'Request timed out',
        code: 'TIMEOUT',
      });
    });

    it('should handle 404 errors', async () => {
      const notFoundError = new Error('Not Found');
      notFoundError.status = 404;
      mockClient.get.mockRejectedValueOnce(notFoundError);

      await expect(journalService.getEntry('nonexistent')).rejects.toMatchObject({
        message: 'Resource not found',
        code: 'NOT_FOUND',
      });
    });
  });
}); 