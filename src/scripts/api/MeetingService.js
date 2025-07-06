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
    
    // Prepare data object for template population
    const cardData = {
      title: title,
      description: description,
      id: id,
      buttonHandler: () => this.handleMeetingAction(meeting)
    };
    
    // Use BaseService template creation method
    return this.createCardFromTemplate('meeting-template', cardData);
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
    const titleElement = clone.querySelector('.meeting-title'),
    descriptionElement = clone.querySelector('.meeting-description'),
    buttonElement = clone.querySelector('.meeting-join-btn');
    
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
      const cardDiv = clone.querySelector('div');
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
  static renderMeetings(meetings, containerId = 'meetings-container') {
    // Use inherited renderItems method with meeting-specific type
    this.renderItems(meetings, containerId, 'meetings');
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