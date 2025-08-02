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
  
  /* ======= GROUP MANAGEMENT ======= */
  
  // Leave a group (remove membership)
  static async leaveGroup(groupId, userId) {
    try {
      const authHeader = UserService.getAuthHeader();
      
      // First, find the membership record
      const membersResponse = await ApiService.getData('members/', authHeader);
      const membership = membersResponse.data.find(member => 
        member.relationships.user.data.id.toString() === userId.toString() &&
        member.relationships.group.data.id.toString() === groupId.toString()
      );
      
      if (!membership) {
        throw new Error('Membership not found');
      }
      
      // Delete the membership
      await ApiService.deleteData(`members/${membership.id}`, authHeader);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to leave group:', error);
      throw error;
    }
  }
  
  // Delete a group (only for admins)
  static async deleteGroup(groupId) {
    try {
      const authHeader = UserService.getAuthHeader();
      
      await ApiService.deleteData(`groups/${groupId}`, authHeader);
      
      return { success: true };
      
    } catch (error) {
      console.error('Failed to delete group:', error);
      throw error;
    }
  }
  
  // Check if user is the creator of a group
  static isGroupCreator(groupMembers, userId) {
    const userMembership = groupMembers.find(member => 
      member.relationships.user.data.id.toString() === userId.toString()
    );
    
    return userMembership?.attributes?.creator === true;
  }
}

export default StudyGroupDetailService;