// ApiService.js

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
const BASIC_AUTH = 'Basic dXNlcjE6cGFzc3dvcmQz';

class ApiService {
  static async getData(endpoint) {
    try {
      const url = `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': BASIC_AUTH,
          'Accept': 'application/vnd.api+json',
        },
      });
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (
        contentType &&
        (contentType.includes('application/json') ||
        contentType.includes('application/vnd.api+json'))
      ) {
        return await response.json();
      } else {
        const text = await response.text();
        throw new Error('Expected JSON, got: ' + text.slice(0, 200));
      }
      
    } catch (error) {
      console.error('Error fetching data from', endpoint, ':', error);
      throw error;
    }
  }
}

export default ApiService;
