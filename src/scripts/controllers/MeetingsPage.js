import PageController from './PageController.js';
import UserService from '../api/UserService.js';
import MeetingsService from '../api/MeetingsService.js';
import StudyGroupsService from '../api/StudyGroupsService.js';
import { Modal } from 'bootstrap';

class MeetingsPage {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.meetings = [];
    this.allMeetings = [];
    this.groups = [];
    this.members = [];
    this.currentFilter = 'all';
    this.currentSort = 'date-asc';
  }
  
  async init() {
    if (this.isInitialized) return;
    
    if (!UserService.isLoggedIn()) {
      PageController.navigateTo('login');
      return;
    }
    
    this.currentUser = UserService.getCurrentUser();
    
    // Wait for template to be available
    await this.waitForTemplate();
    
    // Load and render meetings data
    await this.loadMeetingsData();
    
    // Setup event listeners
    this.setupEventListeners();
    
    this.isInitialized = true;
  }
  
  // Wait for the meeting card template to be available in the DOM
  async waitForTemplate() {
    return new Promise((resolve) => {
      const checkTemplate = () => {
        const template = document.getElementById('meeting-card-template');
        if (template && template.tagName === 'TEMPLATE' && template.content) {
          console.log('Meeting card template found and ready');
          resolve();
        } else {
          console.log('Waiting for meeting card template...');
          setTimeout(checkTemplate, 100);
        }
      };
      checkTemplate();
    });
  }
  
  // Load and filter all meetings data
  async loadMeetingsData() {
    try {
      const authHeader = UserService.getAuthHeader();
      if (!authHeader) {
        throw new Error('No authentication header available');
      }

      // Load all data in parallel
      const [meetingsResponse, groupsResponse, membersResponse, locationsResponse] = await Promise.all([
        MeetingsService.getUpcomingMeetings(),
        StudyGroupsService.getMyStudyGroups(),
        UserService.makeAuthenticatedRequest('members/'),
        UserService.makeAuthenticatedRequest('locations/')
      ]);

      // Store all data
      this.allMeetings = meetingsResponse.meetingData?.data || [];
      this.allGroups = groupsResponse.studyGroupsData?.data || [];
      this.members = membersResponse.data || [];
      this.locations = locationsResponse.data || [];

      // Get current user ID for filtering
      const currentUserId = this.currentUser?.userData?.id?.toString() || this.currentUser?.id?.toString();

      // Filter meetings for current user
      this.filterMeetingsForCurrentUser();

      console.log(`Loaded ${this.meetings.length} meetings for user ${currentUserId}`);
      
      this.renderMeetingsPage();

    } catch (error) {
      console.error('Meetings data loading failed:', error);
      this.handleLoadError();
    }
  }
  
  // Filter meetings and groups for the current user
  filterMeetingsForCurrentUser() {
    const currentUserId = this.currentUser?.userData?.id?.toString() || this.currentUser?.id?.toString();
    
    // Check if current user is admin
    const isAdmin = this.currentUser?.username?.includes('admin') || false;
    
    if (isAdmin) {
      // Admin users see all groups and meetings
      this.groups = this.allGroups;
      this.meetings = this.allMeetings;
    } else {
      // Find groups where user is a member
      const userGroupIds = this.members
        .filter(member => member.relationships.user.data.id === currentUserId)
        .map(member => member.relationships.group.data.id);
        
      // Filter to user's groups only
      this.groups = this.allGroups.filter(group => userGroupIds.includes(group.id));

      // Filter to user's meetings only
      this.meetings = this.allMeetings.filter(meeting => {
        const meetingGroupId = meeting.relationships?.group?.data?.id;
        const isIncluded = userGroupIds.includes(meetingGroupId);

        return isIncluded;
      });
    }
  }
  
  // Render all meetings page components
  renderMeetingsPage() {
    // Update the existing stat counters
    this.updateStatCounters();
    
    // Apply current filter and sort, then render
    this.applyFiltersAndRender();
  }
  
  // Update individual stat counter elements
  updateStatCounters() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Count today's meetings
    const todaysMeetings = this.meetings.filter(meeting => {
      const meetingDate = new Date(meeting.attributes?.start_time);
      return meetingDate >= today && meetingDate < tomorrow;
    });
    
    // Count upcoming meetings
    const upcomingMeetings = this.meetings.filter(meeting => {
      const meetingDate = new Date(meeting.attributes?.start_time);
      return meetingDate >= now;
    });
    
    // Count past meetings
    const pastMeetings = this.meetings.filter(meeting => {
      const meetingDate = new Date(meeting.attributes?.start_time);
      return meetingDate < now;
    });
    
    // Update counter elements
    const upcomingCount = document.getElementById('upcoming-meetings-count');
    const todayCount = document.getElementById('today-meetings-count');
    const pastCount = document.getElementById('past-meetings-count');
    
    if (upcomingCount) upcomingCount.textContent = upcomingMeetings.length;
    if (todayCount) todayCount.textContent = todaysMeetings.length;
    if (pastCount) pastCount.textContent = pastMeetings.length;
  }
  
  // Setup event listeners for filters and controls
  setupEventListeners() {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Update active filter button
        filterButtons.forEach(b => {
          b.classList.remove('btn-gator-accent', 'active');
          b.classList.add('btn-outline-gator-accent');
        });
        e.target.classList.remove('btn-outline-gator-accent');
        e.target.classList.add('btn-gator-accent', 'active');
        
        // Apply filter
        this.currentFilter = e.target.dataset.filter;
        this.applyFiltersAndRender();
      });
    });
    
    // Sort dropdown
    const sortSelect = document.getElementById('sort-meetings');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.applyFiltersAndRender();
      });
    }
    
    // Schedule meeting form
    this.setupScheduleMeetingModal();

    // Meeting card action buttons (using event delegation)
    this.setupMeetingCardActions();
  }
  
  // Setup the schedule meeting modal functionality
  setupScheduleMeetingModal() {
    const modal = document.getElementById('scheduleMeetingModal');
    const form = document.getElementById('meeting-form');
    const groupSelect = document.getElementById('meeting-group');
    const locationSelect = document.getElementById('meeting-location');
    
    if (!modal || !form) return;

    // Add click handlers to "Schedule New Meeting" buttons to clear editing state
    const scheduleButtons = document.querySelectorAll('[data-bs-target="#scheduleMeetingModal"]');
    scheduleButtons.forEach(button => {
      button.addEventListener('click', () => {
        console.log('Schedule New Meeting button clicked - clearing editing state');
        // Clear any existing editing meeting ID immediately
        delete modal.dataset.editingMeetingId;
        // Pre-clear the form immediately
        this.resetModalToCreateMode();
      });
    });
    
    // Populate study groups dropdown when modal opens
    modal.addEventListener('show.bs.modal', () => {
      console.log('Modal opening, editingMeetingId:', modal.dataset.editingMeetingId);
      
      // If no editing meeting ID is set, this is a "create new" operation
      if (!modal.dataset.editingMeetingId) {
        console.log('Create mode detected - clearing form first');
        this.resetModalToCreateMode();
      }
      
      this.populateGroupsDropdown();
      this.populateLocationsDropdown();
      this.clearModalMessages();
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleScheduleMeeting(e);
    });
  }  // Setup event handlers for meeting card actions (edit, cancel)
  setupMeetingCardActions() {
    const meetingsContainer = document.getElementById('meetings-container');
    if (!meetingsContainer) return;

    // Use event delegation to handle dynamically created meeting cards
    meetingsContainer.addEventListener('click', (e) => {
      if (e.target.closest('.edit-meeting')) {
        e.preventDefault();
        const meetingCard = e.target.closest('.meeting-card');
        const meetingId = meetingCard?.dataset.meetingId;
        if (meetingId) {
          this.handleEditMeeting(meetingId);
        }
      } else if (e.target.closest('.cancel-meeting')) {
        e.preventDefault();
        const meetingCard = e.target.closest('.meeting-card');
        const meetingId = meetingCard?.dataset.meetingId;
        if (meetingId) {
          this.handleCancelMeeting(meetingId);
        }
      }
    });
  }

  // Populate the study groups dropdown
  populateGroupsDropdown() {
    const groupSelect = document.getElementById('meeting-group');
    if (!groupSelect) return;
    
    // Clear existing options except the first one
    groupSelect.innerHTML = '<option value="">Select study group...</option>';
    
    // Add user's groups
    this.groups.forEach(group => {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.attributes.name;
      groupSelect.appendChild(option);
    });
  }
  
  // Populate the locations dropdown with actual database locations
  populateLocationsDropdown() {
    const locationSelect = document.getElementById('meeting-location');
    if (!locationSelect) return;
    
    // Clear existing options except the first one
    locationSelect.innerHTML = '<option value="">Select location...</option>';
    
    // Add locations from database
    if (this.locations && this.locations.length > 0) {
      this.locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.id;
        option.textContent = `${location.attributes.building} - ${location.attributes.room}`;
        locationSelect.appendChild(option);
      });
    } else {
      // Fallback if no locations loaded
      console.warn('No locations loaded from database');
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No locations available';
      option.disabled = true;
      locationSelect.appendChild(option);
    }
  }
  
  // Handle the schedule meeting form submission
  async handleScheduleMeeting(event) {
    event.preventDefault();
    
    try {
      this.clearModalMessages();
      
      // Check if we're in edit mode
      const modal = document.getElementById('scheduleMeetingModal');
      const editingMeetingId = modal?.dataset.editingMeetingId;
      const isEditMode = !!editingMeetingId;
      
      // Get form data
      const formData = new FormData(event.target);
      const meetingData = {
        name: document.getElementById('meeting-name').value,
        date: document.getElementById('meeting-date').value,
        startTime: document.getElementById('meeting-start-time').value,
        duration: parseFloat(document.getElementById('meeting-duration').value),
        location: parseInt(document.getElementById('meeting-location').value),
        group: document.getElementById('meeting-group').value,
        description: document.getElementById('meeting-description').value
      };
      
      // Validate required fields
      if (!meetingData.name || !meetingData.date || !meetingData.startTime || !meetingData.group) {
        this.showModalError('Please fill in all required fields.');
        return;
      }
      
      // Create or update meeting via API
      console.log(isEditMode ? 'Updating meeting with data:' : 'Creating meeting with data:', meetingData);
      
      const result = isEditMode 
        ? await this.updateMeeting(editingMeetingId, meetingData)
        : await this.createMeeting(meetingData);
        
      console.log(isEditMode ? 'Update meeting result:' : 'Create meeting result:', result);
      
      if (result.success) {
        const successMessage = isEditMode ? 'Meeting updated successfully!' : 'Meeting scheduled successfully!';
        this.showModalSuccess(successMessage);
        
        // Reset form and close modal immediately
        event.target.reset();
        
        // Reset modal to create mode
        this.resetModalToCreateMode();
        
        // Close modal using data attribute method instead of Bootstrap JS
        const modal = document.getElementById('scheduleMeetingModal');
        const closeButton = modal.querySelector('[data-bs-dismiss="modal"]');
        if (closeButton) {
          closeButton.click();
        }
        
        // Refresh meetings data immediately
        console.log('Meeting saved successfully, refreshing page data...');
        await this.loadMeetingsData();
      } else {
        this.showModalError(result.error || 'Failed to schedule meeting. Please try again.');
      }
      
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      this.showModalError('An error occurred while scheduling the meeting. Please try again.');
    }
  }
  
  // Create a new meeting via API
  async createMeeting(meetingData) {
    try {
      const authHeader = UserService.getAuthHeader();
      if (!authHeader) {
        throw new Error('No authentication available');
      }
      
      // Calculate end time based on start time and duration
      const startDateTime = new Date(`${meetingData.date}T${meetingData.startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + (meetingData.duration * 60 * 60 * 1000));
      
      console.log('Start time:', startDateTime.toISOString());
      console.log('End time:', endDateTime.toISOString());
      
      // Prepare API payload (using flat format like StudyGroupDetailPage)
      const payload = {
        name: meetingData.name,
        description: meetingData.description || '',
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        group: parseInt(meetingData.group),
        location: parseInt(meetingData.location)
      };
      
      console.log('API payload:', JSON.stringify(payload, null, 2));
      
      // Make API request
      const response = await UserService.makeAuthenticatedPostRequest('meetings/', payload);
      console.log('API response:', response);
      
      return { success: true, data: response };
      
    } catch (error) {
      console.error('API error creating meeting:', error);
      return { success: false, error: error.message };
    }
  }

  // Update an existing meeting via API
  async updateMeeting(meetingId, meetingData) {
    try {
      const authHeader = UserService.getAuthHeader();
      if (!authHeader) {
        throw new Error('No authentication available');
      }
      
      // Calculate end time based on start time and duration
      const startDateTime = new Date(`${meetingData.date}T${meetingData.startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + (meetingData.duration * 60 * 60 * 1000));
      
      console.log('Update - Start time:', startDateTime.toISOString());
      console.log('Update - End time:', endDateTime.toISOString());
      
      // Prepare API payload (same format as create)
      const payload = {
        name: meetingData.name,
        description: meetingData.description || '',
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        group: parseInt(meetingData.group),
        location: parseInt(meetingData.location)
      };
      
      console.log('Update API payload:', JSON.stringify(payload, null, 2));
      
      // Make API PUT request
      const response = await ApiService.putData(`meetings/${meetingId}/`, payload, authHeader);
      console.log('Update API response:', response);
      
      return { success: true, data: response };
      
    } catch (error) {
      console.error('API error updating meeting:', error);
      return { success: false, error: error.message };
    }
  }

  // Reset modal back to create mode
  resetModalToCreateMode() {
    console.log('Resetting modal to create mode');
    
    // Reset modal title
    const modalTitle = document.querySelector('#scheduleMeetingModal .modal-title');
    if (modalTitle) {
      modalTitle.textContent = 'Schedule New Meeting';
    }

    // Reset submit button text
    const submitButton = document.querySelector('#scheduleMeetingModal .btn-primary');
    if (submitButton) {
      submitButton.textContent = 'Schedule Meeting';
    }

    // Clear the editing meeting ID from modal dataset
    const modal = document.getElementById('scheduleMeetingModal');
    if (modal && modal.dataset.editingMeetingId) {
      delete modal.dataset.editingMeetingId;
    }

    // Clear all form fields - use correct form ID
    const form = document.getElementById('meeting-form');
    if (form) {
      form.reset();
    }
    
    // Use setTimeout to ensure DOM is ready and force clear specific problematic fields
    setTimeout(() => {
      console.log('Force clearing persistent fields...');
      
      // Manually clear all fields to ensure they're empty
      const fields = [
        'meeting-name',
        'meeting-date', 
        'meeting-start-time',
        'meeting-duration',
        'meeting-location',
        'meeting-group',
        'meeting-description'
      ];
      
      fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
          console.log(`Clearing ${fieldId}, current value: "${field.value}"`);
          
          if (field.type === 'select-one') {
            field.selectedIndex = 0; // Reset to first option
          } else {
            field.value = '';
            // Remove any value attribute
            field.removeAttribute('value');
            // Clear defaultValue
            field.defaultValue = '';
          }
          
          // Trigger events to ensure any framework updates
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
          
          console.log(`After clearing ${fieldId}, value: "${field.value}"`);
        }
      });
    }, 50); // Small delay to ensure DOM operations complete
    
    console.log('Modal reset complete');
  }

  // Apply current filters and sort, then render meetings
  applyFiltersAndRender() {
    let filteredMeetings = [...this.meetings];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Apply filter
    switch (this.currentFilter) {
      case 'upcoming':
        filteredMeetings = filteredMeetings.filter(meeting => {
          const meetingDate = new Date(meeting.attributes?.start_time);
          return meetingDate >= now;
        });
        break;
      case 'today':
        filteredMeetings = filteredMeetings.filter(meeting => {
          const meetingDate = new Date(meeting.attributes?.start_time);
          return meetingDate >= today && meetingDate < tomorrow;
        });
        break;
      case 'all':
      default:
        // No additional filtering needed
        break;
    }
    
    // Apply sort
    switch (this.currentSort) {
      case 'date-desc':
        filteredMeetings.sort((a, b) => {
          const dateA = new Date(a.attributes?.start_time);
          const dateB = new Date(b.attributes?.start_time);
          return dateB - dateA;
        });
        break;
      case 'name':
        filteredMeetings.sort((a, b) => {
          const nameA = (a.attributes?.name || '').toLowerCase();
          const nameB = (b.attributes?.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
      case 'date-asc':
      default:
        filteredMeetings.sort((a, b) => {
          const dateA = new Date(a.attributes?.start_time);
          const dateB = new Date(b.attributes?.start_time);
          return dateA - dateB;
        });
        break;
    }
    
    // Render filtered and sorted meetings
    MeetingsService.renderMeetings(filteredMeetings, 'meetings-container', {
      locations: this.locations,
      groups: this.allGroups
    });
  }
  
  // Refresh all meetings data and UI
  async refreshMeetings() {
    console.log('RefreshMeetings called - reloading data...');
    this.meetings = [];
    this.allMeetings = [];
    await this.loadMeetingsData();
    console.log('RefreshMeetings completed');
  }
  
  // Handle data loading errors
  handleLoadError() {
    PageController.showError('Unable to load meetings. Please try refreshing the page.');
  }
  
  showModalError(message) {
    const errorDiv = document.getElementById('modalErrorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorDiv && errorText) {
      errorText.textContent = message;
      errorDiv.classList.remove('d-none');
      errorDiv.classList.add('show');
      this.hideSuccessMessage();
    } else {
      alert(message);
    }
  }
  
  showModalSuccess(message) {
    const successDiv = document.getElementById('modalSuccessMessage');
    const successText = document.getElementById('successText');
    
    if (successDiv && successText) {
      successText.textContent = message;
      successDiv.classList.remove('d-none');
      successDiv.classList.add('show');
      this.hideErrorMessage();
    } else {
      alert(message);
    }
  }
  
  hideErrorMessage() {
    const errorDiv = document.getElementById('modalErrorMessage');
    if (errorDiv) {
      errorDiv.classList.add('d-none');
      errorDiv.classList.remove('show');
    }
  }
  
  hideSuccessMessage() {
    const successDiv = document.getElementById('modalSuccessMessage');
    if (successDiv) {
      successDiv.classList.add('d-none');
      successDiv.classList.remove('show');
    }
  }
  
  clearModalMessages() {
    this.hideErrorMessage();
    this.hideSuccessMessage();
  }

  // Handle editing a meeting
  async handleEditMeeting(meetingId) {
    console.log('Edit meeting:', meetingId);
    
    // Find the meeting data
    const meeting = this.allMeetings.find(m => m.id === meetingId);
    if (!meeting) {
      console.error('Meeting not found:', meetingId);
      return;
    }

    // Get modal elements
    const modal = document.getElementById('scheduleMeetingModal');
    const modalTitle = document.getElementById('scheduleMeetingModalLabel');
    const submitButton = document.querySelector('#scheduleMeetingModal [type="submit"]');
    
    if (!modal || !modalTitle || !submitButton) {
      console.error('Modal elements not found');
      return;
    }

    // Change modal to edit mode
    modalTitle.innerHTML = '<span class="fa-solid fa-edit text-teal me-3"></span>Edit Meeting';
    submitButton.innerHTML = '<span class="fa-solid fa-save me-2"></span>Update Meeting';
    
    // Store the meeting ID for later update
    modal.dataset.editingMeetingId = meetingId;
    
    // Populate dropdowns first, then populate form with existing meeting data
    console.log('Populating dropdowns for edit. Groups:', this.groups.length, 'Locations:', this.locations.length);
    this.populateGroupsDropdown();
    this.populateLocationsDropdown();
    
    // Show the modal first
    const bootstrapModal = new Modal(modal);
    bootstrapModal.show();
    
    // Wait for modal to be fully shown, then populate form
    modal.addEventListener('shown.bs.modal', () => {
      console.log('Modal fully shown, now populating form...');
      this.populateEditForm(meeting);
    }, { once: true }); // Use once: true so the listener is removed after firing
  }

  // Handle canceling/deleting a meeting
  async handleCancelMeeting(meetingId) {
    console.log('Cancel meeting:', meetingId);
    
    // Find the meeting data
    const meeting = this.allMeetings.find(m => m.id === meetingId);
    if (!meeting) {
      console.error('Meeting not found:', meetingId);
      return;
    }

    // Show confirmation dialog
    const meetingName = meeting.attributes?.name || 'this meeting';
    const confirmed = confirm(`Are you sure you want to cancel "${meetingName}"?\n\nThis action cannot be undone.`);
    
    if (!confirmed) {
      return;
    }

    try {
      // Delete the meeting via API
      const authHeader = UserService.getAuthHeader();
      if (!authHeader) {
        throw new Error('No authentication available');
      }

      await ApiService.deleteData(`meetings/${meetingId}/`, authHeader);
      
      // Refresh the meetings list
      await this.loadMeetingsData();
      
      // Show success message (you could add a toast notification here)
      console.log('Meeting cancelled successfully');
      alert('Meeting cancelled successfully!');
      
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      alert('Failed to cancel meeting. Please try again.');
    }
  }

  // Populate the edit form with existing meeting data
  populateEditForm(meeting) {
    console.log('Full meeting object structure:', JSON.stringify(meeting, null, 2));
    
    const attrs = meeting.attributes;
    if (!attrs) {
      console.log('No attributes found in meeting object');
      return;
    }

    console.log('Populating edit form with meeting data:', meeting);
    console.log('Meeting attributes:', attrs);

    // Set form values
    document.getElementById('meeting-name').value = attrs.name || '';
    
    // Debug description field specifically - check multiple possible locations
    const descriptionField = document.getElementById('meeting-description');
    console.log('Description field element:', descriptionField);
    
    // Try multiple possible locations for description
    let descriptionValue = '';
    if (attrs.description !== undefined) {
      descriptionValue = attrs.description;
      console.log('Found description in attrs.description:', descriptionValue);
    } else if (meeting.description !== undefined) {
      descriptionValue = meeting.description;
      console.log('Found description in meeting.description:', descriptionValue);
    } else if (attrs.text !== undefined) {
      descriptionValue = attrs.text;
      console.log('Found description in attrs.text:', descriptionValue);
    } else {
      console.log('No description found in any expected location');
      console.log('Available attrs keys:', Object.keys(attrs));
      console.log('Available meeting keys:', Object.keys(meeting));
    }
    
    if (descriptionField) {
      descriptionField.value = descriptionValue || '';
      console.log('Set description field value to:', descriptionField.value);
    } else {
      console.error('Description field not found!');
    }

    // Parse the start time to get date and time
    if (attrs.start_time) {
      const startDate = new Date(attrs.start_time);
      const endDate = new Date(attrs.end_time);
      
      // Format date (YYYY-MM-DD)
      const dateStr = startDate.toISOString().split('T')[0];
      document.getElementById('meeting-date').value = dateStr;
      
      // Format time (HH:MM)
      const timeStr = startDate.toTimeString().slice(0, 5);
      document.getElementById('meeting-start-time').value = timeStr;
      
      // Calculate duration in hours
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      document.getElementById('meeting-duration').value = durationHours;
    }

    // Set group - try different possible locations for group ID
    const groupDropdown = document.getElementById('meeting-group');
    if (groupDropdown) {
      let groupId = null;
      
      // Try different possible locations for group ID
      if (meeting.relationships?.group?.data?.id) {
        groupId = meeting.relationships.group.data.id;
        console.log('Found group ID in relationships:', groupId);
      } else if (attrs.group) {
        groupId = attrs.group;
        console.log('Found group ID in attrs.group:', groupId);
      } else if (attrs.group_id) {
        groupId = attrs.group_id;
        console.log('Found group ID in attrs.group_id:', groupId);
      }
      
      console.log('Available group options:', Array.from(groupDropdown.options).map(opt => `${opt.value}: ${opt.text}`));
      
      if (groupId) {
        // Try multiple methods to set the dropdown value
        groupDropdown.value = String(groupId);
        
        // Also try setting by selectedIndex as backup
        const optionIndex = Array.from(groupDropdown.options).findIndex(option => option.value === String(groupId));
        if (optionIndex >= 0) {
          groupDropdown.selectedIndex = optionIndex;
        }
        
        console.log('Set group dropdown to:', groupId, 'Selected value:', groupDropdown.value, 'Selected index:', groupDropdown.selectedIndex);
      } else {
        console.log('No group ID found in meeting data');
      }
    }
    
    // Set location - try different possible locations for location ID
    const locationDropdown = document.getElementById('meeting-location');
    if (locationDropdown) {
      let locationId = null;
      
      // Try different possible locations for location ID
      if (meeting.relationships?.location?.data?.id) {
        locationId = meeting.relationships.location.data.id;
        console.log('Found location ID in relationships:', locationId);
      } else if (attrs.location) {
        locationId = attrs.location;
        console.log('Found location ID in attrs.location:', locationId);
      } else if (attrs.location_id) {
        locationId = attrs.location_id;
        console.log('Found location ID in attrs.location_id:', locationId);
      }
      
      console.log('Available location options:', Array.from(locationDropdown.options).map(opt => `${opt.value}: ${opt.text}`));
      
      if (locationId) {
        // Try multiple methods to set the dropdown value
        locationDropdown.value = String(locationId);
        
        // Also try setting by selectedIndex as backup
        const optionIndex = Array.from(locationDropdown.options).findIndex(option => option.value === String(locationId));
        if (optionIndex >= 0) {
          locationDropdown.selectedIndex = optionIndex;
        }
        
        console.log('Set location dropdown to:', locationId, 'Selected value:', locationDropdown.value, 'Selected index:', locationDropdown.selectedIndex);
      } else {
        console.log('No location ID found in meeting data');
      }
    }
  }
}

export default MeetingsPage;