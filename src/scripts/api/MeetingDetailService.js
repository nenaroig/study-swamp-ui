import ApiService from './ApiService.js';
import UserService from './UserService.js';
import BaseService from './BaseService.js';

class MeetingDetailService extends BaseService {
  
  /* ======= COMMON HELPERS ======= */
  
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
  
  /* ======= GETTERS ======= */
  
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
  
  /* ======= MEETING MANAGEMENT ======= */
  
  // Delete a meeting (only for admins or meeting creators)
  static async deleteMeeting(meetingId) {
    try {
      const authHeader = UserService.getAuthHeader();
      
      await ApiService.deleteData(`meetings/${meetingId}`, authHeader);
      
      return { success: true };
      
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      throw error;
    }
  }
  
  // Update meeting details
  static async updateMeeting(meetingId, meetingData) {
    try {
      const authHeader = UserService.getAuthHeader();
      
      const response = await ApiService.putData(`meetings/${meetingId}/`, meetingData, authHeader);
      
      return { success: true, data: response };
      
    } catch (error) {
      console.error('Failed to update meeting:', error);
      throw error;
    }
  }
  
  // Check if user can edit a meeting (creator or admin)
  static canUserEditMeeting(meeting, currentUser) {
    const isAdmin = currentUser?.userData?.attributes?.is_superuser || 
                    currentUser?.username?.toLowerCase().includes('admin');
    
    // For now, allow admins to edit any meeting
    // In the future, you might want to check meeting creator
    return isAdmin;
  }
}

export default MeetingDetailService;