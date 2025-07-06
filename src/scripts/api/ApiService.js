/**
 * ApiService - HTTP client for API communication
 * 
 * Provides standardized methods for making HTTP requests to the backend API.
 * Handles JSON:API format, authentication headers, and error responses.
 * 
 * Features:
 * - Automatic URL construction and endpoint normalization
 * - JSON:API content type handling
 * - Authentication header management
 * - Comprehensive error handling with detailed error messages
 * - Response validation and parsing
 * 
 * @static
 */

// Base URL for all API requests - points to local development server
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

class ApiService {

  /* ======= GET REQUESTS ======= */
  
  /**
   * Makes a GET request to the specified API endpoint
   * 
   * @param {string} endpoint - API endpoint (with or without leading slash)
   * @param {string|null} authHeader - Authorization header value (optional)
   * @returns {Promise<Object>} Parsed JSON response from the API
   * @throws {Error} If request fails, response is not OK, or response is not JSON
   * 
   * @example
   * // Get user data with authentication
   * const userData = await ApiService.getData('users/123', 'Bearer token123');
   * 
   * @example
   * // Get public data without authentication
   * const publicData = await ApiService.getData('public/announcements');
   */
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
  
  /* ======= POST REQUESTS ======= */

  /**
   * Makes a POST request to the specified API endpoint with JSON data
   * 
   * @param {string} endpoint - API endpoint (with or without leading slash)
   * @param {Object} data - Data to send in request body (will be JSON.stringify'd)
   * @param {string|null} authHeader - Authorization header value (optional)
   * @returns {Promise<Object>} Parsed JSON response from the API
   * @throws {Error} If request fails, response is not OK, or response is not JSON
   * 
   * @example
   * // Create a new meeting
   * const meetingData = {
   *   name: 'Team Standup',
   *   start_time: '2025-07-06T09:00:00Z'
   * };
   * const result = await ApiService.postData('meetings/', meetingData, authHeader);
   * 
   * @example
   * // Submit form data
   * const formData = { username: 'john', email: 'john@example.com' };
   * const response = await ApiService.postData('users/', formData);
   */
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

  /* ======= UTILITIES ======= */

  /**
   * Returns the base URL used for all API requests
   * Useful for constructing URLs outside of this service or debugging
   * 
   * @returns {string} The base API URL
   * 
   * @example
   * const baseUrl = ApiService.getBaseUrl();
   * console.log('API base URL:', baseUrl); // "http://127.0.0.1:8000/api/v1"
   */
  static getBaseUrl() {
    return API_BASE_URL;
  }
}

export default ApiService;