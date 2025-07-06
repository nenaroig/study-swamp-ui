import ApiService from './ApiService.js';
import UserService from './UserService.js';

class MeetingService {

  /* ======= GETTERS ======= */
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
  
  // Filter for upcoming meetings
  static async getUpcomingMeetingsFiltered() {
    try {
      const authHeader = UserService.getAuthHeader(),
      response = await ApiService.getData('meetings/', authHeader),
      now = new Date();

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

  /* ======= DISPLAY/RENDERING ======= */
  static createMeetingCard(meeting, index = 0) {
    const template = document.getElementById('meeting-template');
    if (!template) {
      return;
    }
    
    const clone = template.content.cloneNode(true);
    
    // Fill in the data
    const title = meeting.attributes?.name || 'Untitled Meeting',
    timeDescription = this.formatMeetingTime(meeting);
    
    clone.querySelector('.meeting-title').textContent = title;
    clone.querySelector('.meeting-description').textContent = timeDescription;
    
    clone.querySelector('.meeting-join-btn').addEventListener('click', () => {
      this.handleMeetingAction(meeting);
    });
    
    const meetingDiv = clone.querySelector('div');
    meetingDiv.id = `meeting-${meeting.id || index}`;
    
    return clone;
  }
  
  static formatMeetingTime(meeting) {
    const startTime = meeting.attributes?.start_time;
    const endTime = meeting.attributes?.end_time;
    
    if (!startTime) return 'No time specified';
    
    const startDate = new Date(startTime);
    const endDate = endTime ? new Date(endTime) : null;
    const now = new Date();
    
    // Check if meeting is today
    const isToday = startDate.toDateString() === now.toDateString();
    
    // Check if meeting is tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = startDate.toDateString() === tomorrow.toDateString();
    
    // Format time
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const startTimeStr = startDate.toLocaleTimeString([], timeOptions);
    
    if (isToday) {
      if (endDate) {
        const endTimeStr = endDate.toLocaleTimeString([], timeOptions);
        return `Today ${startTimeStr} - ${endTimeStr}`;
      }
      return `Today at ${startTimeStr}`;
    } else if (isTomorrow) {
      if (endDate) {
        const endTimeStr = endDate.toLocaleTimeString([], timeOptions);
        return `Tomorrow ${startTimeStr} - ${endTimeStr}`;
      }
      return `Tomorrow at ${startTimeStr}`;
    } else {
      const dateStr = startDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      });
      
      if (endDate) {
        const endTimeStr = endDate.toLocaleTimeString([], timeOptions);
        return `${dateStr} ${startTimeStr} - ${endTimeStr}`;
      }
      return `${dateStr} at ${startTimeStr}`;
    }
  }
  
  static renderMeetings(meetings, containerId = 'meetings-container') {
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    if (!meetings || meetings.length === 0) {
      this.renderEmptyState(container);
      return;
    }
    
    // Create meeting cards
    meetings.forEach((meeting, index) => {
      const meetingCard = this.createMeetingCard(meeting, index);
      container.appendChild(meetingCard);
    });
  }
  
  static renderEmptyState(container) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'd-flex align-items-center justify-content-center mt-4 p-4';
    emptyDiv.innerHTML = `
      <div class="text-center text-muted">
        <h5>No upcoming meetings</h5>
        <p class="mb-0">You don't have any meetings scheduled for today.</p>
      </div>
    `;
    container.appendChild(emptyDiv);
  }
}

export default MeetingService;