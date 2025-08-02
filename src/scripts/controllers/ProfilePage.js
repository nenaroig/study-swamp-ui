import UserService from '../api/UserService.js';

class Profile {
  constructor() {
    this.pageName = 'Profile';
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    this.loadUser();
    this.setupFormHandling();
    this.isInitialized = true;
  }

  loadUser() {
    const currentUserData = UserService.getCurrentUserData();
    const userData = currentUserData?.attributes;
    
    if (userData) {
      // Populate form fields with user data
      const firstNameField = document.getElementById('firstName');
      const lastNameField = document.getElementById('lastName');
      const usernameField = document.getElementById('username');
      const emailField = document.getElementById('email');
      
      if (firstNameField && userData.first_name) {
        firstNameField.value = userData.first_name;
      }
      if (lastNameField && userData.last_name) {
        lastNameField.value = userData.last_name;
      }
      if (usernameField && userData.username) {
        usernameField.value = userData.username;
      }
      if (emailField && userData.email) {
        emailField.value = userData.email;
      }
    }
  }

  setupFormHandling() {
    const form = document.getElementById('profileForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleFormSubmit(e);
      });
    }
  }

  async handleFormSubmit(e) {
    const form = e.target;
    const formData = new FormData(form);
    
    // Get current user data to preserve existing fields
    const currentUserData = UserService.getCurrentUserData() || {};
    
    // Get form values
    const profileData = {
      first_name: formData.get('firstName').trim(),
      last_name: formData.get('lastName').trim(),
      username: formData.get('username').trim(),
      email: formData.get('email').trim()
    };
    
    // Basic validation
    if (!profileData.first_name || !profileData.last_name || !profileData.username || !profileData.email) {
      this.showError('All fields are required.');
      return;
    }
    
    try {
      // Get the current user ID for updating specific user
      const userId = currentUserData.id;
      
      if (userId) {
        // Update existing user by ID
        const response = await UserService.makeAuthenticatedPatchRequest(`users/${userId}/`, profileData);
        
        // Update local user data with response
        UserService.setCurrentUserData(response);
        this.showSuccess('Profile updated successfully!');
      } else {
        // Fallback: just update local data if no API endpoint available
        const updatedUserData = { ...currentUserData, attributes: { ...currentUserData.attributes, ...profileData } };
        UserService.setCurrentUserData(updatedUserData);
        this.showSuccess('Profile updated locally!');
      }
      
    } catch (error) {
      console.error('Profile update error:', error);
      
      // Handle specific error cases
      if (error.message.includes('username already exists')) {
        this.showError('Username is already taken. Please choose a different username.');
      } else if (error.message.includes('password')) {
        this.showError('Unable to update profile. Please contact support.');
      } else {
        this.showError('Failed to update profile. Please try again.');
      }
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const successDiv = document.getElementById('successMessage');
    
    if (errorDiv && errorText) {
      // Hide success message
      if (successDiv) {
        successDiv.classList.add('d-none');
        successDiv.classList.remove('show');
      }
      
      errorText.textContent = message;
      errorDiv.classList.remove('d-none');
      errorDiv.classList.add('show');
    }
  }

  showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    const errorDiv = document.getElementById('errorMessage');
    
    if (successDiv && successText) {
      // Hide error message
      if (errorDiv) {
        errorDiv.classList.add('d-none');
        errorDiv.classList.remove('show');
      }
      
      successText.textContent = message;
      successDiv.classList.remove('d-none');
      successDiv.classList.add('show');
    }
  }

}

export default Profile;