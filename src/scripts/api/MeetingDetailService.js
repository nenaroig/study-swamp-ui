// MeetingDetailService - manages current meeting data and UI

import ApiService from './ApiService.js';
import UserService from './UserService.js';
import BaseService from './BaseService.js';

class MeetingDetailService extends BaseService {

  // Fetch meetings with auth
  static async fetchMeetings() {
    try {
      const authHeader = UserService.getAuthHeader();
      const meetingData = await ApiService.getData('meetings/', authHeader);
      return meetingData;
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
      throw error;
    }
  }
  
  // Convert meeting name to slug (shared utility)
  static createMeetingSlug(meetingName) {
    return meetingName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }
  
  // Fetches a specific meeting by slug
  static async getMeetingBySlug(slug) {
    try {
      const response = await this.fetchMeetings();
      const allMeetings = response.data || [];
      
      // Find meeting by matching slug
      const meeting = allMeetings.find(meeting => {
        const meetingName = meeting.attributes?.name || '';
        const meetingSlug = this.createMeetingSlug(meetingName);
        return meetingSlug === slug;
      });
      
      return {
        meetingData: meeting || null,
      };
    } catch (error) {
      console.error('Failed to get meeting by slug:', error);
      throw error;
    }
  }
  
  // Delete a meeting (only for admin users)
  static async deleteMeeting(meetingId) {
    try {
      const authHeader = UserService.getAuthHeader();
      
      // Delete the meeting
      await ApiService.deleteData(`meetings/${meetingId}`, authHeader);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      throw error;
    }
  }
}

export default MeetingDetailService;