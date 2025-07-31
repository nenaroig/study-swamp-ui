// BaseService - Abstract base class for service modules
// Provides shared rendering functionality for lists of items

export default class BaseService {
  
  // Abstract method - must be implemented by child classes
  static createCard(item, index = 0) {
    throw new Error('createCard method must be implemented by child class');
  }
  
  // Abstract method - must be implemented by child classes  
  static getEmptyStateConfig() {
    throw new Error('getEmptyStateConfig method must be implemented by child class');
  }
  
  // Renders a list of items into a container
  static renderItems(items, containerId, itemType, templateId) {
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }
    
    container.innerHTML = '';
    
    if (!items || items.length === 0) {
      this.renderEmptyState(container);
      return;
    }
    
    items.forEach((item, index) => {
      const itemCard = this.createCard(item, index);
      if (itemCard) {
        container.appendChild(itemCard);
      }
    });
  }
  
  // Renders empty state message
  static renderEmptyState(container) {
    const config = this.getEmptyStateConfig();
    
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'd-flex align-items-center justify-content-between mt-4';
    emptyDiv.innerHTML = `
      <div class="text-muted">
        <h3 class="h5">${config.title}</h3>
        <p class="text-muted mb-0">${config.message}</p>
      </div>
    `;
    container.appendChild(emptyDiv);
  }
  
  // Creates a card element from HTML template
  static createCardFromTemplate(templateId, data) {
    const template = document.getElementById(templateId);
    if (!template) {
      console.error(`Template with id "${templateId}" not found`);
      return null;
    }
    
    if (template.tagName !== 'TEMPLATE') {
      console.error(`Element with id "${templateId}" is not a template element (found: ${template.tagName})`);
      return null;
    }
    
    if (!template.content) {
      console.error(`Template with id "${templateId}" has no content property`);
      return null;
    }
    
    try {
      const clone = template.content.cloneNode(true);
      this.populateCardData(clone, data);
      return clone;
    } catch (error) {
      console.error(`Error cloning template "${templateId}":`, error);
      return null;
    }
  }
  
  // Populates cloned template with data
  static populateCardData(clone, data) {
    const titleElement = clone.querySelector('.card-title') || clone.querySelector('.title');
    const descriptionElement = clone.querySelector('.card-description') || clone.querySelector('.description');
    const buttonElement = clone.querySelector('.card-btn');
    
    if (titleElement && data.title) {
      titleElement.textContent = data.title;
    }
    
    if (descriptionElement && data.description) {
      descriptionElement.textContent = data.description;
    }
    
    if (buttonElement && data.buttonHandler) {
      buttonElement.addEventListener('click', data.buttonHandler);
    }
    
    if (data.id) {
      const cardDiv = clone.querySelector('div');
      if (cardDiv) {
        cardDiv.id = data.id;
      }
    }
  }
  
  // Formats date with relative time support (Today/Tomorrow)
  static formatDate(dateString, options = {}) {
    if (!dateString) return 'No date specified';
    
    const date = new Date(dateString);
    const now = new Date();
    
    const defaultOptions = {
      showTime: true,
      showRelative: true,
      timeFormat: { hour: '2-digit', minute: '2-digit' },
      dateFormat: { month: 'short', day: 'numeric' }
    };
    
    const config = { ...defaultOptions, ...options };
    
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
    
    const dateStr = date.toLocaleDateString([], config.dateFormat);
    return config.showTime ? 
    `${dateStr} at ${date.toLocaleTimeString([], config.timeFormat)}` :
    dateStr;
  }
  
  // Formats time range from start and end times
  static formatTimeRange(startTime, endTime, options = {}) {
    if (!startTime) return 'No time specified';
    
    const startDate = new Date(startTime);
    const endDate = endTime ? new Date(endTime) : null;
    const timeStr = this.formatDate(startTime, options);
    
    if (endDate) {
      const endTimeStr = endDate.toLocaleTimeString([], options.timeFormat || { hour: '2-digit', minute: '2-digit' });
      return timeStr.replace(/at \d{2}:\d{2}/, `${startDate.toLocaleTimeString([], options.timeFormat || { hour: '2-digit', minute: '2-digit' })} - ${endTimeStr}`);
    }
    
    return timeStr;
  }
}