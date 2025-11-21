import { PostmanCollection } from '../types/postman.types.js';

export class PostmanApiService {
  private baseUrl = 'https://api.getpostman.com';

  /**
   * Updates an existing collection in Postman Cloud
   * @param collectionId - The UID of the collection to update
   * @param collection - The Postman collection object
   * @param apiKey - Postman API Key
   */
  async updateCollection(collectionId: string, collection: PostmanCollection, apiKey: string): Promise<void> {
    const url = `${this.baseUrl}/collections/${collectionId}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({ collection }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Postman API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update collection: ${error.message}`);
      }
      throw error;
    }
  }
}
