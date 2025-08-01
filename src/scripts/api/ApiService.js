// ApiService - Centralized HTTP client for backend API communication
// Handles GET, POST, PUT, DELETE requests with JSON:API support and authentication

// Base URL for all API requests - points to local development server
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
const API_ENUM_URL = 'http://127.0.0.1:8000/api';

class ApiService {
  
  /* ======= REQUESTS ======= */
  
  // GET request to API endpoint
  static async getData(endpoint, authHeader = null) {
    try {
      // Construct full URL, removing any leading slashes from endpoint to prevent double slashes
      const url = `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`;
      
      // Set up request headers with JSON:API accept header
      const headers = {
        'Accept': 'application/vnd.api+json',
      };
      
      // Add authorization header if provided
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }
      
      // Make the HTTP request
      const response = await fetch(url, { headers }),
      contentType = response.headers.get('content-type');
      
      // Handle non-200 responses
      if (!response.ok) {
        // Try to get error details from response body for better debugging
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
      
      // Validate response content type and parse JSON
      if (
        contentType &&
        (contentType.includes('application/json') ||
        contentType.includes('application/vnd.api+json'))
      ) {
        return await response.json();
      } else {
        // Handle unexpected content types
        const text = await response.text();
        throw new Error('Expected JSON, got: ' + text.slice(0, 200));
      }
    } catch (error) {
      // Log error for debugging and re-throw for caller to handle
      console.error('Error fetching data from', endpoint, ':', error);
      throw error;
    }
  }
  
  static async getEnumData(endpoint, authHeader = null) {
    try {
      // Use the enum-specific base URL
      const url = `${API_ENUM_URL}/${endpoint.replace(/^\/+/, '')}`;
      
      const headers = {
        'Accept': 'application/json',
      };
      
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }
      
      const response = await fetch(url, { headers }),
      contentType = response.headers.get('content-type');
      
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
      console.error('Error fetching enum data from', endpoint, ':', error);
      throw error;
    }
  }
  
  // POST request with JSON data  
  static async postData(endpoint, data, authHeader = null) {
    try {
      // Construct full URL, removing any leading slashes from endpoint
      const url = `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`;
      
      // Set up request headers for JSON:API format
      const headers = {
        'Accept': 'application/vnd.api+json', // What we want to receive
        'Content-Type': 'application/json', // What we are sending
      };
      
      // Add authorization header if provided
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }
      
      // Make the HTTP POST request with JSON body
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data) // Convert data object to JSON string
      });
      
      const contentType = response.headers.get('content-type');
      
      // Handle non-200 responses
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          // Try to extract error details from response body
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        } catch (e) {
          // Ignore if we can't read the error
        }
        throw new Error(errorMessage);
      }
      
      // Validate response content type and parse JSON
      if (
        contentType &&
        (contentType.includes('application/json') ||
        contentType.includes('application/vnd.api+json'))
      ) {
        return await response.json();
      } else {
        // Handle unexpected content types
        const text = await response.text();
        throw new Error('Expected JSON, got: ' + text.slice(0, 200));
      }
    } catch (error) {
      // Log error for debugging and re-throw for caller to handle
      console.error('Error posting data to', endpoint, ':', error);
      throw error;
    }
  }
  
  // PUT request to update resource
  static async putData(endpoint, data, authHeader = null) {
    try {
      // Construct full URL, removing any leading slashes from endpoint to prevent double slashes
      const url = `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`;
      
      // Set up request headers with JSON:API content type for PUT requests
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.api+json',
      };
      
      // Add authorization header if provided
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }
      
      // Make the HTTP PUT request
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      
      const contentType = response.headers.get('content-type');
      
      // Handle non-200 responses
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
      
      // Validate response has JSON content type before parsing (accept both JSON and JSON:API)
      if (!contentType || (!contentType.includes('application/json') && !contentType.includes('application/vnd.api+json'))) {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }
      
      // Parse and return JSON response
      return await response.json();
      
    } catch (error) {
      // Log error for debugging and re-throw for caller to handle
      console.error('Error putting data to', endpoint, ':', error);
      throw error;
    }
  }
  
  // DELETE request to remove resource
  static async deleteData(endpoint, authHeader = null) {
    try {
      // Construct full URL, removing any leading slashes from endpoint to prevent double slashes
      const url = `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`;
      
      // Set up request headers with JSON:API accept header
      const headers = {
        'Accept': 'application/vnd.api+json',
      };
      
      // Add authorization header if provided
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }
      
      // Make the HTTP DELETE request
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });
      
      // Handle non-200 responses
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
      
      // For DELETE requests, response might be empty (204 No Content)
      // Handle successful DELETE responses - both empty and with content
      const contentType = response.headers.get('content-type');
      
      // Return success for standard "no content" responses
      if (response.status === 204 || response.status === 202) {
        return { success: true };
      }
      
      // If no content-type or not JSON, assume successful deletion
      if (!contentType || !contentType.includes('application/json')) {
        return { success: true };
      }
      
      // Parse and return JSON response if present
      return await response.json();
      
    } catch (error) {
      // Log error for debugging and re-throw for caller to handle
      console.error('Error deleting data from', endpoint, ':', error);
      throw error;
    }
  }
  
  /* ======= UTILITIES ======= */
  
  // Get the base API URL
  static getBaseUrl() {
    return API_BASE_URL;
  }
}

export default ApiService;