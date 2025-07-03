// ApiService.js
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

class ApiService {
  /* ======= GET REQUESTS ======= */
  static async getData(endpoint, authHeader = null) {
    try {
      const url = `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`;
      
      const headers = {
        'Accept': 'application/vnd.api+json',
      };
      
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }
      
      console.log('Making request to:', url);
      console.log('With headers:', headers);
      
      const response = await fetch(url, { headers });
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        } catch (e) {
          // Ignore if we can't read the error
        }
        throw new Error(errorMessage);
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
  
  /* ======= POST REQUESTS ======= */
  static async postData(endpoint, data, authHeader = null) {
    try {
      const url = `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`;
      
      const headers = {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/json',
      };
      
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }
      
      console.log('Making POST request to:', url);
      console.log('With headers:', headers);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        } catch (e) {
          // Ignore if we can't read the error
        }
        throw new Error(errorMessage);
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
      console.error('Error posting data to', endpoint, ':', error);
      throw error;
    }
  }

  /* ======= UTILITIES ======= */
  static getBaseUrl() {
    return API_BASE_URL;
  }
}

export default ApiService;