// MeetingService - manages meeting data and UI rendering

import ApiService from './ApiService.js';
import UserService from './UserService.js';
import BaseService from './BaseService.js';

class MeetingService extends BaseService {

  // Fetches all meetings for the current user
  static async getUpcomingMeetings() {
    try {
      const authHeader = UserService.getAuthHeader();
      const meetingData = await ApiService.getData('meetings/', authHeader);

      return {
        meetingData: meetingData,
      };
    } catch (error) {
      console.error('Failed to get upcoming meetings:', error);
      throw error;
    }
  }

  // Fetches and filters meetings to only include future meetings
  static async getUpcomingMeetingsFiltered() {
    try {
      const authHeader = UserService.getAuthHeader();
      const response = await ApiService.getData('meetings/', authHeader);
      const now = new Date();

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

  // Determines meeting status based on date/time
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

  // Creates a meeting card element without using templates
  static createCard(meeting, index = 0) {
    const title = meeting.attributes?.name || 'Untitled Meeting';
    const startTime = new Date(meeting.attributes?.start_time);
    const description = startTime.toLocaleDateString() + ' at ' + startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const cardDiv = document.createElement('div');
    cardDiv.className = 'd-flex align-items-center justify-content-between mt-4';
    cardDiv.id = `meeting-${meeting.id || index}`;

    const contentDiv = document.createElement('div');

    const titleElement = document.createElement('h3');
    titleElement.className = 'h5';
    titleElement.textContent = title;

    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'text-muted mb-0';
    descriptionElement.textContent = description;

    contentDiv.appendChild(titleElement);
    contentDiv.appendChild(descriptionElement);

    const joinBtn = document.createElement('div');
    joinBtn.className = 'btn btn-gator-accent btn-sm';
    joinBtn.textContent = 'Join';
    joinBtn.style.cursor = 'pointer';
    joinBtn.addEventListener('click', () => this.handleMeetingAction(meeting));

    cardDiv.appendChild(contentDiv);
    cardDiv.appendChild(joinBtn);

    return cardDiv;
  }

  // Populates meeting data in template (legacy method)
  static populateCardData(clone, data) {
    console.log('MeetingService.populateCardData called with:', data);

    if (data && data.status) {
      const statusBadge = clone.querySelector('.meeting-status-badge');
      if (statusBadge) {
        statusBadge.textContent = data.status.text;
        statusBadge.className = `meeting-status-badge badge ${data.status.cssClass}`;
      }
    }
  }

  // Formats date for display
  static formatDate(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Formats time for display
  static formatTime(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Invalid time';
    }

    return dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Provides empty state configuration
  static getEmptyStateConfig() {
    return {
      title: 'No upcoming meetings',
      message: 'You don\'t have any meetings scheduled for today.'
    };
  }

  // Renders meetings
  static renderMeetings(meetings, containerId = 'meetings-container', context = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!meetings || meetings.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'mt-5';

      const message = document.createElement('p');
      message.className = 'text-muted mb-3';
      message.textContent = 'No upcoming meetings';
      emptyDiv.appendChild(message);

      // Show create button only if user has joined groups
      const userGroups = context.userGroups || [];
      if (userGroups && userGroups.length > 0) {
        const createBtn = document.createElement('button');
        createBtn.className = 'btn btn-teal btn-sm mt-3';
        createBtn.textContent = 'Schedule a Meeting';

        // Add Bootstrap modal attributes - no JavaScript needed
        createBtn.setAttribute('data-bs-toggle', 'modal');
        createBtn.setAttribute('data-bs-target', '#scheduleMeetingModal');

        emptyDiv.appendChild(createBtn);
      }

      container.appendChild(emptyDiv);
      return;
    }

    meetings.forEach((meeting, index) => {
      const card = this.createCard(meeting, index);
      container.appendChild(card);
    });
  }

  // Handles meeting card interactions
  static handleMeetingAction(meeting) {
    console.log('Meeting action clicked:', meeting);

    const meetingName = meeting.attributes?.name || 'Untitled Meeting';
    const meetingId = meeting.id;

    console.log(`Action requested for meeting: ${meetingName} (ID: ${meetingId})`);
  }
}

export default MeetingService;