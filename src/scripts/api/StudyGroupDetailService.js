// StudyGroupDetailService - manages current study group data and UI

import ApiService from './ApiService.js';
import UserService from './UserService.js';
import BaseService from './BaseService.js';

class StudyGroupDetailService extends BaseService {
  
  /* ======= COMMON HELPERS ======= */
  
  // Fetch groups with auth
  static async fetchGroups() {
    try {
      const authHeader = UserService.getAuthHeader();
      const studyGroupData = await ApiService.getData('groups/', authHeader);
      return studyGroupData;
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      throw error;
    }
  }
  
  // Convert group name to slug (shared utility)
  static createGroupSlug(groupName) {
    return groupName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }
  
  /* ======= GETTERS ======= */
  
  // Fetches a specific study group by slug
  static async getGroupBySlug(slug) {
    try {
      const response = await this.fetchGroups();
      const allGroups = response.data || [];
      
      // Find group by matching slug
      const group = allGroups.find(group => {
        const groupName = group.attributes?.name || '';
        const groupSlug = this.createGroupSlug(groupName);
        return groupSlug === slug;
      });
      
      return {
        studyGroupData: group || null,
      };
    } catch (error) {
      console.error('Failed to get study group by slug:', error);
      throw error;
    }
  }
}

export default StudyGroupDetailService;