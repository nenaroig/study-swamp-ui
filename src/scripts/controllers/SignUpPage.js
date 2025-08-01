import PageController from './PageController.js';
import ApiService from '../api/ApiService.js';

class SignUpPage {
  constructor() {
    this.pageName = 'Sign Up';
    this.eventListeners = [];
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    const signupForm = document.getElementById('signupForm');
    
    if (signupForm) {
      PageController.addEventListener(signupForm, 'submit', (e) => this.handleSignup(e), this.eventListeners);
    }
    
    this.isInitialized = true;
  }

  // Process signup form submission
  async handleSignup(e) {
    e.preventDefault();
    
    const formData = {
      first_name: document.getElementById('first_name')?.value,
      last_name: document.getElementById('last_name')?.value,
      email: document.getElementById('email')?.value,
      username: document.getElementById('username')?.value,
      password: document.getElementById('password')?.value,
      confirmPassword: document.getElementById('confirmPassword')?.value
    };
    
    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.email || 
        !formData.username || !formData.password || !formData.confirmPassword) {
      PageController.showError('Please fill in all fields', e.target);
      return;
    }
    
    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      PageController.showError('Passwords do not match', e.target);
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      PageController.showError('Please enter a valid email address', e.target);
      return;
    }
    
    try {
      // Create user account via API
      const userData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        username: formData.username,
        password: formData.password
      };
      
      const response = await ApiService.postData('users/', userData);
      
      if (response && response.data) {
        PageController.showSuccess('Account created successfully! You can now sign in.', e.target);
        
        // Clear the form
        e.target.reset();
        
        // Navigate to login page after successful signup
        setTimeout(() => {
          PageController.navigateTo('login');
        }, 2000);
        
      } else {
        PageController.showError('Failed to create account. Please try again.', e.target);
      }
      
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle specific error messages from the API
      if (error.message && error.message.includes('username')) {
        PageController.showError('Username already exists. Please choose a different username.', e.target);
      } else if (error.message && error.message.includes('email')) {
        PageController.showError('Email already exists. Please use a different email address.', e.target);
      } else {
        PageController.showError('Failed to create account. Please try again.', e.target);
      }
    }
  }
}

export default SignUpPage;