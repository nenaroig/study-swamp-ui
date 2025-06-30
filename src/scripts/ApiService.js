// ApiService.js
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

class ApiService {
  static username = null;
  static password = null;
  static currentUserData = null;
  
  static setCredentials(username, password) {
    this.username = username;
    this.password = password;
    console.log('Credentials set for user:', username); // remove
  }
  
  static setCurrentUserData(userData) {
    this.currentUserData = userData;
    // Store user in sessionStorage for persistence
    sessionStorage.setItem('currentUserData', JSON.stringify(userData));
    console.log('Current user data stored:', userData); // remove
  }
  
  static getCurrentUserData() {
    return this.currentUserData;
  }
  
  static loadStoredUserData() {
    const storedData = sessionStorage.getItem('currentUserData');
    console.log('Loading stored user data:', storedData);
    
    if (storedData) {
      try {
        this.currentUserData = JSON.parse(storedData);
        console.log('User data loaded from storage:', this.currentUserData); // remove
        return this.currentUserData;
      } catch (error) {
        console.error('Failed to parse stored user data:', error); // remove
        return null;
      }
    }
    return null;
  }
  
  static clearCredentials() {
    this.username = null;
    this.password = null;
    this.currentUserData = null;
    console.log('Credentials cleared'); //remove
  }
  
  static getAuthHeader() {
    if (this.username && this.password) {
      const authHeader = `Basic ${btoa(`${this.username}:${this.password}`)}`;
      console.log(`Basic ${btoa(`${this.username}:${this.password}`)}`);
      return authHeader;
    }
    console.log('No credentials available'); //remove
    return null;
  }
  
  static async getData(endpoint) {
    try {
      const url = `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`;
      const authHeader = this.getAuthHeader();
      
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
  
  static async login(username, password) {
    this.setCredentials(username, password);
    
    try {
      const response = await this.getData('');
      console.log('Login response:', response);
      return response;
    } catch (error) {
      // Clear credentials if login fails
      this.clearCredentials();
      throw error;
    }
  }
  
  // Add methods for session storage
  static storeCredentials(username, password) {
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('password', password);
    console.log('Credentials stored in session'); //remove
  }
  
  static loadStoredCredentials() {
    const username = sessionStorage.getItem('username');
    const password = sessionStorage.getItem('password');
    if (username && password) {
      this.setCredentials(username, password);
      this.loadStoredUserData();
      console.log('Loaded stored credentials for:', username); // remove
      return true;
    }
    return false;
  }
  
  static clearStoredCredentials() {
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('password');
  }
  
  // Get current user info
  static getCurrentUser() {
    return {
      username: this.username,
      userData: this.currentUserData,
      isLoggedIn: this.isLoggedIn()
    };
  }
  
  // Get current username
  static getCurrentUsername() {
    return this.username;
  }
  
  static logout() {
    console.log('Logging out user:', this.username); //remove
    this.clearCredentials();
    this.clearStoredCredentials();
    
    // Dispatch logout event for other parts of app to listen to
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    return true;
  }
  
  static isLoggedIn() {
    return this.username !== null && this.password !== null;
  }
}

export default ApiService;