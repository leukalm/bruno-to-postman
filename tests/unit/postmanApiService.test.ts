import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PostmanApiService } from '../../src/services/postmanApiService.js';
import { PostmanCollection } from '../../src/types/postman.types.js';

describe('PostmanApiService', () => {
  let service: PostmanApiService;
  const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    service = new PostmanApiService();
    global.fetch = mockFetch;
    mockFetch.mockClear();
  });

  const mockCollection: PostmanCollection = {
    info: {
      name: 'Test Collection',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [],
  };

  it('should successfully upload a collection', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collection: { uid: '123' } }),
    } as Response);

    await service.updateCollection('12345', mockCollection, 'valid-api-key');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.getpostman.com/collections/12345',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'valid-api-key',
        },
        body: JSON.stringify({ collection: mockCollection }),
      })
    );
  });

  it('should throw an error when API returns non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid API Key',
    } as Response);

    await expect(service.updateCollection('12345', mockCollection, 'invalid-key'))
      .rejects.toThrow('Postman API error: 401 Unauthorized - Invalid API Key');
  });

  it('should throw an error when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(service.updateCollection('12345', mockCollection, 'valid-key'))
      .rejects.toThrow('Failed to update collection: Network error');
  });
});
