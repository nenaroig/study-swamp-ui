/**
 * BaseService - Abstract base class for service modules
 * 
 * Provides shared rendering functionality and utilities for services that need to:
 * - Display lists of items (meetings, groups, assignments, etc.)
 * - Create cards from HTML templates
 * - Handle empty states consistently
 * - Format dates and times
 * 
 * Child classes must implement:
 * - createCard(item, index) - Creates a card element for a single item
 * - getEmptyStateConfig() - Returns {title, message} for empty state display
 * 
 * @abstract
 */
export default class BaseService {
  
  /* ======= ABSTRACT METHODS ======= */
  
  /**
   * Creates a card element for a single item
   * Must be implemented by child classes
   * 
   * @param {Object} item - The data item to create a card for
   * @param {number} index - The index of the item in the list (default: 0)
   * @returns {DocumentFragment} The created card element
   * @abstract
   */
  static createCard(item, index = 0) {
    throw new Error('createCard method must be implemented by child class');
  }

  /**
   * Returns configuration for empty state display
   * Must be implemented by child classes
   * 
   * @returns {Object} Configuration object with {title: string, message: string}
   * @abstract
   */
  static getEmptyStateConfig() {
    throw new Error('getEmptyStateConfig method must be implemented by child class');
  }
  
  /* ======= SHARED RENDERING METHODS ======= */

  /**
   * Renders a list of items into a container
   * Handles both populated lists and empty states
   * 
   * @param {Array} items - Array of items to render
   * @param {string} containerId - ID of the DOM element to render into
   * @param {string} itemType - Type of items for logging (default: 'items')
   */
  static renderItems(items, containerId, itemType = 'items') {
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }
    
    // Clear existing content to prevent duplication
    container.innerHTML = '';
    
    // Handle empty state
    if (!items || items.length === 0) {
      this.renderEmptyState(container);
      return;
    }
    
    // Create item cards using the child class implementation
    items.forEach((item, index) => {
      const itemCard = this.createCard(item, index);
      if (itemCard) {
        container.appendChild(itemCard);
      }
    });
  }

  /**
   * Renders an empty state message in the container
   * Uses configuration from child class's getEmptyStateConfig()
   * 
   * @param {HTMLElement} container - DOM element to render empty state into
   */
  static renderEmptyState(container) {
    const config = this.getEmptyStateConfig();
    
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'd-flex align-items-center justify-content-between mt-4';
    emptyDiv.innerHTML = `
      <div class="text-center text-muted">
        <h3 class="h5">${config.title}</h3>
        <p class="text-muted mb-0">${config.message}</p>
      </div>
    `;
    container.appendChild(emptyDiv);
  }
  
  /* ======= SHARED CARD CREATION HELPERS ======= */

  /**
   * Creates a card element from an HTML template
   * Clones the template and populates it with provided data
   * 
   * @param {string} templateId - ID of the HTML template element
   * @param {Object} data - Data object to populate the template with
   * @returns {DocumentFragment|null} Cloned and populated template, or null if template not found
   */
  static createCardFromTemplate(templateId, data) {
    const template = document.getElementById(templateId);
    if (!template) {
      console.error(`Template with id "${templateId}" not found`);
      return null;
    }
    
    const clone = template.content.cloneNode(true);
    
    // Apply data to the cloned template
    this.populateCardData(clone, data);
    
    return clone;
  }
  
  /**
   * Populates a cloned template with data
   * Can be overridden by child classes for custom selectors
   * 
   * Default implementation looks for common CSS class patterns:
   * - Title: .card-title, .title
   * - Description: .card-description, .description
   * - Button: .card-btn
   * 
   * @param {DocumentFragment} clone - Cloned template element
   * @param {Object} data - Data object containing:
   *   @param {string} data.title - Text for title element
   *   @param {string} data.description - Text for description element
   *   @param {Function} data.buttonHandler - Click handler for button element
   *   @param {string} data.id - ID to assign to the card container
   */
  static populateCardData(clone, data) {
    const titleElement = clone.querySelector('.card-title') || 
                        clone.querySelector('.title');
    
    const descriptionElement = clone.querySelector('.card-description') || 
                              clone.querySelector('.description');
    
    const buttonElement = clone.querySelector('.card-btn');
    
    // Populate title if element and data exist
    if (titleElement && data.title) {
      titleElement.textContent = data.title;
    }
    
    // Populate description if element and data exist
    if (descriptionElement && data.description) {
      descriptionElement.textContent = data.description;
    }
    
    // Attach click handler if button and handler exist
    if (buttonElement && data.buttonHandler) {
      buttonElement.addEventListener('click', data.buttonHandler);
    }
    
    // Set ID on the card container if provided
    if (data.id) {
      const cardDiv = clone.querySelector('div');
      if (cardDiv) {
        cardDiv.id = data.id;
      }
    }
  }
  
  /* ======= UTILITY METHODS ======= */

  /**
   * Formats a date string with relative time support
   * Supports "Today", "Tomorrow", or formatted date strings
   * 
   * @param {string} dateString - ISO date string to format
   * @param {Object} options - Formatting options:
   *   @param {boolean} options.showTime - Whether to include time (default: true)
   *   @param {boolean} options.showRelative - Whether to show "Today"/"Tomorrow" (default: true)
   *   @param {Object} options.timeFormat - Time formatting options for toLocaleTimeString()
   *   @param {Object} options.dateFormat - Date formatting options for toLocaleDateString()
   * @returns {string} Formatted date string or "No date specified" if invalid
   * 
   * @example
   * formatDate('2025-07-06T14:30:00') // "Today at 2:30 PM"
   * formatDate('2025-07-07T09:00:00') // "Tomorrow at 9:00 AM"
   * formatDate('2025-07-10T16:00:00') // "Jul 10 at 4:00 PM"
   */
  static formatDate(dateString, options = {}) {
    if (!dateString) return 'No date specified';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Default options with sensible defaults
    const defaultOptions = {
      showTime: true,
      showRelative: true,
      timeFormat: { hour: '2-digit', minute: '2-digit' },
      dateFormat: { month: 'short', day: 'numeric' }
    };
    
    const config = { ...defaultOptions, ...options };
    
    // Handle relative dates (Today/Tomorrow)
    if (config.showRelative) {
      const isToday = date.toDateString() === now.toDateString();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = date.toDateString() === tomorrow.toDateString();
      
      if (isToday) {
        return config.showTime ? 
          `Today at ${date.toLocaleTimeString([], config.timeFormat)}` :
          'Today';
      } else if (isTomorrow) {
        return config.showTime ? 
          `Tomorrow at ${date.toLocaleTimeString([], config.timeFormat)}` :
          'Tomorrow';
      }
    }
    
    // Format as regular date
    const dateStr = date.toLocaleDateString([], config.dateFormat);
    return config.showTime ? 
      `${dateStr} at ${date.toLocaleTimeString([], config.timeFormat)}` :
      dateStr;
  }
  
  /**
   * Formats a time range from start and end times
   * Handles cases where end time may be missing
   * 
   * @param {string} startTime - ISO start time string
   * @param {string} endTime - ISO end time string (optional)
   * @param {Object} options - Formatting options (passed to formatDate)
   * @returns {string} Formatted time range or single time
   * 
   * @example
   * formatTimeRange('2025-07-06T14:30:00', '2025-07-06T15:30:00') 
   * // "Today 2:30 PM - 3:30 PM"
   * 
   * formatTimeRange('2025-07-06T14:30:00') 
   * // "Today at 2:30 PM"
   */
  static formatTimeRange(startTime, endTime, options = {}) {
    if (!startTime) return 'No time specified';
    
    const startDate = new Date(startTime),
    endDate = endTime ? new Date(endTime) : null,
    timeStr = this.formatDate(startTime, options);

    // If we have an end time, format as a range
    if (endDate) {
      const endTimeStr = endDate.toLocaleTimeString([], options.timeFormat || { hour: '2-digit', minute: '2-digit' });
      // Replace the single time with a time range
      return timeStr.replace(/at \d{2}:\d{2}/, `${startDate.toLocaleTimeString([], options.timeFormat || { hour: '2-digit', minute: '2-digit' })} - ${endTimeStr}`);
    }
    
    return timeStr;
  }
}