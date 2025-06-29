// ApiService.js
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

class ApiService {
  static username = 'user1';  // Hardcode for testing
  static password = 'password3';  // Hardcode for testing
  
  static getAuthHeader() {
    if (this.username && this.password) {
      const authHeader = `Basic ${btoa(`${this.username}:${this.password}`)}`;
      console.log(`Basic ${btoa(`${this.username}:${this.password}`)}`);
      return authHeader;
    }
    return null;
  }

  static async getData(endpoint) {
    try {
      const url = `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`,
      authHeader = this.getAuthHeader();
      
      const headers = {
        'Accept': 'application/vnd.api+json',
      };
      
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }
      
      const response = await fetch(url, { headers }),
      contentType = response.headers.get('content-type');

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
