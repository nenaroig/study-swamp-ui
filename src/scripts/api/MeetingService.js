/**
 * MeetingService - Service for managing meeting data and UI
 * 
 * Extends BaseService to provide meeting-specific functionality including:
 * - Fetching meeting data from the API
 * - Filtering upcoming meetings by date
 * - Rendering meeting cards in the UI
 * - Handling meeting-related user interactions
 * 
 * This service works with meeting objects that have the structure:
 * {
 *   id: string,
 *   attributes: {
 *     name: string,
 *     start_time: string (ISO date),
 *     end_time: string (ISO date),
 *     date: string (fallback date field)
 *   }
 * }
 * 
 * @extends BaseService
 */

import ApiService from './ApiService.js';
import UserService from './UserService.js';
import BaseService from './BaseService.js';

class MeetingService extends BaseService {

  /* ======= GETTERS ======= */
  
  /**
   * Fetches all meetings for the current user
   * Returns raw meeting data without filtering
   * 
   * @returns {Promise<Object>} Object containing:
   *   @returns {Object} meetingData - Raw API response with meeting data
   * @throws {Error} If API request fails or user is not authenticated
   * 
   * @example
   * const { meetingData } = await MeetingService.getUpcomingMeetings();
   * console.log('All meetings:', meetingData);
   */
  static async getUpcomingMeetings() {
    try {
      // Get authentication header from UserService
      const authHeader = UserService.getAuthHeader();
      
      // Fetch meetings data from API
      const meetingData = await ApiService.getData('meetings/', authHeader);
      
      return {
        meetingData: meetingData,
      };
    } catch (error) {
      console.error('Failed to get upcoming meetings:', error);
      throw error;
    }
  }
  
  /**
   * Fetches and filters meetings to only include those scheduled in the future
   * This is the preferred method for displaying upcoming meetings in the UI
   * 
   * @returns {Promise<Object>} Object containing:
   *   @returns {Array} meetingData - Array of meeting objects occurring after now
   *   @returns {number} total - Count of upcoming meetings
   * @throws {Error} If API request fails or user is not authenticated
   * 
   * @example
   * const { meetingData, total } = await MeetingService.getUpcomingMeetingsFiltered();
   * console.log(`Found ${total} upcoming meetings`);
   */
  static async getUpcomingMeetingsFiltered() {
    try {
      // Get authentication header from UserService
      const authHeader = UserService.getAuthHeader();
      
      // Fetch all meetings from API
      const response = await ApiService.getData('meetings/', authHeader);
      const now = new Date();

      // Filter meetings to only include those in the future
      // Uses start_time as primary field, falls back to date field
      const upcomingMeetings = response.data?.filter(meeting => {
        const meetingDate = new Date(meeting.attributes?.start_time || meeting.attributes?.date);
        return meetingDate > now;
      }) || [];
      
      return {
        meetingData: upcomingMeetings,
        total: upcomingMeetings.length
      };
    } catch (error) {
      console.error('Failed to get upcoming meetings:', error);
      throw error;
    }
  }

  /* ======= ABSTRACT METHOD IMPLEMENTATIONS ======= */
  
  /**
   * Determines the status of a meeting based on its date/time
   * 
   * @param {Object} meeting - Meeting object from API
   * @returns {Object} Status information with text and CSS class
   */
  static getMeetingStatus(meeting) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const meetingDate = new Date(meeting.attributes?.start_time || meeting.attributes?.date);
    
    console.log('Meeting status check:', {
      meetingName: meeting.attributes?.name,
      meetingDate: meetingDate,
      now: now,
      today: today,
      isPast: meetingDate < now,
      isToday: meetingDate >= today && meetingDate < tomorrow,
      isUpcoming: meetingDate >= now
    });
    
    if (meetingDate < now) {
      return {
        text: 'Past',
        cssClass: 'bg-secondary'
      };
    } else if (meetingDate >= today && meetingDate < tomorrow) {
      return {
        text: 'Today',
        cssClass: 'bg-success'
      };
    } else {
      return {
        text: 'Upcoming',
        cssClass: 'bg-info'
      };
    }
  }

  /**
   * Creates a meeting card element (implements BaseService abstract method)
   * 
   * @param {Object} meeting - Meeting object from API
   * @param {number} index - Index in the meetings array (default: 0)
   * @returns {DocumentFragment} HTML element for the meeting card
   * 
   * @example
   * const meeting = { id: '123', attributes: { name: 'Team Meeting' } };
   * const card = MeetingService.createCard(meeting, 0);
   */
  static createCard(meeting, index = 0) {
    // Extract meeting information with fallbacks
    const title = meeting.attributes?.name || 'Untitled Meeting';
    const description = this.formatMeetingTime(meeting);
    const id = `meeting-${meeting.id || index}`;
    const status = this.getMeetingStatus(meeting);
    
    // Check if template exists
    const template = document.getElementById('meeting-card-template');
    if (!template) {
      console.error('Meeting card template not found');
      return null;
    }
    
    // Clone template manually to ensure we control the population
    if (template.tagName !== 'TEMPLATE' || !template.content) {
      console.error('Invalid template element');
      return null;
    }
    
    const clone = template.content.cloneNode(true);
    
    // Prepare data object for template population
    const cardData = {
      title: title,
      description: description,
      id: id,
      meeting: meeting,
      status: status,
      buttonHandler: () => this.handleMeetingAction(meeting)
    };
    
    // Update the cloned template with meeting data
    const statusBadge = clone.querySelector('.meeting-status-badge');
    if (statusBadge) {
      statusBadge.textContent = status.text;
      statusBadge.className = `meeting-status-badge badge ${status.cssClass}`;
    }
    
    const titleElement = clone.querySelector('.meeting-name');
    if (titleElement) {
      titleElement.textContent = title;
    }
    
    const descriptionElement = clone.querySelector('.meeting-description');
    if (descriptionElement) {
      descriptionElement.textContent = description;
    }

    // Populate meeting date
    const dateElement = clone.querySelector('.meeting-date');
    if (dateElement && meeting.attributes?.start_time) {
      const meetingDate = new Date(meeting.attributes.start_time);
      dateElement.textContent = meetingDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    // Populate meeting time
    const timeElement = clone.querySelector('.meeting-time');
    if (timeElement && meeting.attributes?.start_time) {
      const meetingDate = new Date(meeting.attributes.start_time);
      timeElement.textContent = meetingDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    // Populate meeting location
    const locationElement = clone.querySelector('.meeting-location');
    if (locationElement) {
      // Try to get location from different possible sources
      let locationText = 'Online'; // default
      
      console.log('Meeting data for location lookup:', {
        meetingId: meeting.id,
        relationships: meeting.relationships,
        attributes: meeting.attributes,
        hasContext: !!this._renderContext,
        contextLocations: this._renderContext?.locations?.length || 0
      });
      
      // Try to find location by ID in the context data
      const locationId = meeting.attributes?.location || meeting.relationships?.location?.data?.id;
      if (locationId && this._renderContext?.locations) {
        const location = this._renderContext.locations.find(loc => loc.id == locationId);
        if (location) {
          locationText = `${location.attributes.building} - ${location.attributes.room}`;
          console.log('Found location via context lookup:', locationText);
        }
      }
      // Fallback to existing relationship/attribute checks
      else if (meeting.relationships?.location?.data?.attributes) {
        const loc = meeting.relationships.location.data.attributes;
        locationText = `${loc.building} - ${loc.room}`;
        console.log('Found location in relationships:', locationText);
      } else if (meeting.attributes?.location_name) {
        locationText = meeting.attributes.location_name;
        console.log('Found location in attributes.location_name:', locationText);
      } else {
        console.log('No location data found, using default:', locationText);
      }
      
      locationElement.textContent = locationText;
    }

    // Populate study group
    const groupElement = clone.querySelector('.meeting-group');
    if (groupElement) {
      // Try to get group from different possible sources
      let groupText = 'Study Group'; // default
      
      console.log('Meeting data for group lookup:', {
        meetingId: meeting.id,
        relationships: meeting.relationships,
        attributes: meeting.attributes,
        hasContext: !!this._renderContext,
        contextGroups: this._renderContext?.groups?.length || 0
      });
      
      // Try to find group by ID in the context data
      const groupId = meeting.attributes?.group || meeting.relationships?.group?.data?.id;
      if (groupId && this._renderContext?.groups) {
        const group = this._renderContext.groups.find(grp => grp.id == groupId);
        if (group) {
          groupText = group.attributes.name;
          console.log('Found group via context lookup:', groupText);
        }
      }
      // Fallback to existing relationship/attribute checks
      else if (meeting.relationships?.group?.data?.attributes) {
        groupText = meeting.relationships.group.data.attributes.name;
        console.log('Found group in relationships:', groupText);
      } else if (meeting.attributes?.group_name) {
        groupText = meeting.attributes.group_name;
        console.log('Found group in attributes.group_name:', groupText);
      } else {
        console.log('No group data found, using default:', groupText);
      }
      
      groupElement.textContent = groupText;
    }

    // Set meeting ID on the card for action buttons
    const cardElement = clone.querySelector('.meeting-card');
    if (cardElement && meeting.id) {
      cardElement.dataset.meetingId = meeting.id;
    }

    return clone;
  }
  
  /**
   * Populates meeting-specific data in the cloned template
   * Overrides BaseService method to handle meeting status badge and other fields
   * 
   * @param {DocumentFragment} clone - Cloned template element
   * @param {Object} data - Data object containing meeting information
   */
  static populateCardData(clone, data) {
    console.log('MeetingService.populateCardData called with:', data);
    
    // Update the status badge if status data is available
    if (data && data.status) {
      const statusBadge = clone.querySelector('.meeting-status-badge');
      if (statusBadge) {
        statusBadge.textContent = data.status.text;
        statusBadge.className = `meeting-status-badge badge ${data.status.cssClass}`;
      }
    }
  }
  
  /**
   * Formats a date for display (e.g., "Aug 7, 2025")
   * 
   * @param {Date|string} date - Date object or date string to format
   * @returns {string} Formatted date string
   */
  static formatDate(date) {
    // Handle string input by converting to Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if we have a valid date
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  /**
   * Formats a time for display (e.g., "2:30 PM")
   * 
   * @param {Date|string} date - Date object or date string to format
   * @returns {string} Formatted time string
   */
  static formatTime(date) {
    // Handle string input by converting to Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if we have a valid date
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Invalid time';
    }
    
    return dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Provides empty state configuration (implements BaseService abstract method)
   * 
   * @returns {Object} Configuration for empty state display:
   *   @returns {string} title - Main heading for empty state
   *   @returns {string} message - Descriptive message for empty state
   */
  static getEmptyStateConfig() {
    return {
      title: 'No upcoming meetings',
      message: 'You don\'t have any meetings scheduled for today.'
    };
  }
  
  /* ======= CUSTOM CARD POPULATION ======= */
  
  /**
   * Populates meeting card template with data (overrides BaseService method)
   * Uses meeting-specific CSS selectors for precise element targeting
   * 
   * @param {DocumentFragment} clone - Cloned template element
   * @param {Object} data - Data object containing:
   *   @param {string} data.title - Meeting title
   *   @param {string} data.description - Formatted meeting time
   *   @param {string} data.id - Unique card identifier
   *   @param {Function} data.buttonHandler - Click handler for join button
   */
  static populateCardData(clone, data) {
    // Find meeting-specific elements using precise selectors
    const titleElement = clone.querySelector('.meeting-name'),
    descriptionElement = clone.querySelector('.meeting-description'),
    buttonElement = clone.querySelector('.join-meeting');
    
    // Populate title if both element and data exist
    if (titleElement && data.title) {
      titleElement.textContent = data.title;
    }
    
    // Populate description if both exist
    if (descriptionElement && data.description) {
      descriptionElement.textContent = data.description;
    }
    
    // Attach click handler to join button if both exist
    if (buttonElement && data.buttonHandler) {
      buttonElement.addEventListener('click', data.buttonHandler);
    }
    
    // Set unique ID on the card container for targeting
    if (data.id) {
      const cardDiv = clone.querySelector('.meeting-card');
      if (cardDiv) {
        cardDiv.id = data.id;
      }
    }
  }
  
  /* ======= DISPLAY/RENDERING ======= */
  
  /**
   * Formats meeting time information for display
   * Converts start and end times into user-friendly format
   * 
   * @param {Object} meeting - Meeting object with time attributes
   * @returns {string} Formatted time string (e.g., "Today 2:00 PM - 3:00 PM")
   * 
   * @example
   * const meeting = {
   *   attributes: {
   *     start_time: '2025-07-06T14:00:00Z',
   *     end_time: '2025-07-06T15:00:00Z'
   *   }
   * };
   * const timeStr = MeetingService.formatMeetingTime(meeting);
   * // Returns: "Today 2:00 PM - 3:00 PM"
   */
  static formatMeetingTime(meeting) {
    const startTime = meeting.attributes?.start_time,
    endTime = meeting.attributes?.end_time;
    
    // Use BaseService utility method for consistent time formatting
    return this.formatTimeRange(startTime, endTime);
  }
  
  /**
   * Renders a list of meetings into the specified container
   * Convenience method that calls the inherited renderItems method
   * 
   * @param {Array} meetings - Array of meeting objects to render
   * @param {string} containerId - ID of DOM element to render into (default: 'meetings-container')
   * 
   * @example
   * const meetings = await MeetingService.getUpcomingMeetingsFiltered();
   * MeetingService.renderMeetings(meetings.meetingData);
   */
  static renderMeetings(meetings, containerId = 'meetings-container', context = {}) {
    // Store context data for use in createCard
    this._renderContext = context;
    
    // Use inherited renderItems method
    this.renderItems(meetings, containerId);
    
    // Clean up context after rendering
    delete this._renderContext;
  }
  
  /* ======= ACTION HANDLERS ======= */
  
  /**
   * Handles user interactions with meeting cards (e.g., join button clicks)
   * Currently logs the action - should be implemented with actual functionality
   * 
   * @param {Object} meeting - The meeting object that was interacted with
   * 
   * @todo Implement actual meeting actions such as:
   *   - Opening meeting link/URL
   *   - Navigating to meeting page
   *   - Adding to calendar - potentially
   *   - Sending reminders - potentially
   * 
   * @example
   * // This method is called automatically when user clicks join button - coming soon...
   * // Implementation might look like:
   * // window.location.href = `/meetings/${meeting.id}`;
   * // or showMeetingDetailsModal(meeting);
   */
  static handleMeetingAction(meeting) {
    // TODO: Implement meeting action (join, view details, etc.)
    console.log('Meeting action clicked:', meeting);
    
    // Extract meeting information for logging/debugging
    const meetingName = meeting.attributes?.name || 'Untitled Meeting',
    meetingId = meeting.id;
    
    // Example implementation possibilities:
    // - Show meeting details modal: showMeetingDetailsModal(meeting) - maybe
    // - Navigate to meeting page: window.location.href = `/meetings/${meetingId}`
    
    // For now, just log the action for debugging
    console.log(`Action requested for meeting: ${meetingName} (ID: ${meetingId})`);
  }
}

export default MeetingService;