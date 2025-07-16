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
  
  // Fetches members of a specific group
  static async getGroupMembers(groupId) {
    try {
      if (!groupId) {
        throw new Error('Group ID is required to fetch members');
      }
      
      const authHeader = UserService.getAuthHeader();
      const response = await ApiService.getData(`groups/${groupId}/members/`, authHeader);
      
      return {
        members: response.data || []
      };
    } catch (error) {
      console.error('Failed to get group members:', error);
      throw error;
    }
  }
  
  // Fetches meetings associated with a specific group
  static async getGroupMeetings(groupId) {
    try {
      if (!groupId) {
        throw new Error('Group ID is required to fetch meetings');
      }
      
      const authHeader = UserService.getAuthHeader();
      const response = await ApiService.getData(`groups/${groupId}/meetings/`, authHeader);
      
      return {
        meetings: response.data || []
      };
    } catch (error) {
      console.error('Failed to get group meetings:', error);
      throw error;
    }
  }
  
  // Fetches comments/discussions for a specific group
  static async getGroupComments(groupId) {
    try {
      if (!groupId) {
        throw new Error('Group ID is required to fetch comments');
      }
      
      const authHeader = UserService.getAuthHeader();
      const response = await ApiService.getData(`groups/${groupId}/comments/`, authHeader);
      
      return {
        comments: response.data || []
      };
    } catch (error) {
      console.error('Failed to get group comments:', error);
      throw error;
    }
  }
  
  /* ======= RENDERING ======= */
  
  // Renders a list of members in the specified container
  static renderMembers(members, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    if (!members || members.length === 0) {
      container.innerHTML = '<p class="text-muted text-center mt-4">No members found</p>';
      return;
    }
    
    // Render each member
    members.forEach(member => {
      this.renderMemberCard(member, container);
    });
  }
  
  // Renders a list of meetings in the specified container
  static renderMeetings(meetings, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    if (!meetings || meetings.length === 0) {
      container.innerHTML = '<p class="text-muted text-center mt-4">No upcoming meetings</p>';
      return;
    }
    
    // Render each meeting
    meetings.forEach(meeting => {
      this.renderMeetingCard(meeting, container);
    });
  }
  
  // Renders a list of comments in the specified container
  static renderComments(comments, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    if (!comments || comments.length === 0) {
      container.innerHTML = '<p class="text-muted text-center mt-4">No comments yet. Be the first to start a discussion!</p>';
      return;
    }
    
    // Sort comments by date (newest first)
    const sortedComments = [...comments].sort((a, b) => {
      const dateA = new Date(a.attributes?.created_at || 0);
      const dateB = new Date(b.attributes?.created_at || 0);
      return dateB - dateA;
    });
    
    // Render each comment
    sortedComments.forEach(comment => {
      this.renderCommentCard(comment, container);
    });
  }
  
  // Renders a member card in the members list
  static renderMemberCard(member, container) {
    const attributes = member.attributes || {};
    const firstName = attributes.first_name || '';
    const lastName = attributes.last_name || '';
    const email = attributes.email || '';
    const role = attributes.role || 'Member';
    const isActive = attributes.is_active !== false;
    
    // Generate initials
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    
    // Determine badge class based on role
    let badgeClass, badgeText;
    if (role.toLowerCase() === 'creator') {
      badgeClass = 'text-bg-info text-white';
      badgeText = 'Creator';
    } else if (role.toLowerCase() === 'editor') {
      badgeClass = 'bg-success';
      badgeText = 'Editor';
    } else if (!isActive) {
      badgeClass = 'bg-warning';
      badgeText = 'Inactive';
    } else {
      badgeClass = 'bg-secondary';
      badgeText = 'Member';
    }
    
    // Create the member card HTML
    const memberCard = document.createElement('div');
    memberCard.className = 'd-flex align-items-center justify-content-between mt-4';
    memberCard.innerHTML = `
      <div class="d-flex align-items-center">
        <div class="member-avatar rounded-circle text-white me-3">${initials}</div>
        <div>
          <div class="fw-500">${firstName} ${lastName}</div>
          <p class="smaller text-muted">${email}</p>
        </div>
      </div>
      <div>
        <span class="badge rounded-pill ${badgeClass}">${badgeText}</span>
        ${role.toLowerCase() === 'editor' ? '<span class="badge rounded-pill bg-success ms-1">Editor</span>' : ''}
      </div>
    `;
    
    container.appendChild(memberCard);
  }
  
  // Renders a meeting card in the meetings list
  static renderMeetingCard(meeting, container) {
    const attributes = meeting.attributes || {};
    const title = attributes.title || 'Untitled Meeting';
    const startTime = attributes.start_time ? new Date(attributes.start_time) : null;
    const endTime = attributes.end_time ? new Date(attributes.end_time) : null;
    const location = attributes.location || 'No location specified';
    const isVirtual = attributes.is_virtual || false;
    const link = attributes.meeting_link || 'https://zoom.us/signin';
    
    // Format the time
    let timeString = 'Time not specified';
    if (startTime) {
      timeString = this.formatTimeRange(startTime, endTime);
    }
    
    // Create the meeting card HTML
    const meetingCard = document.createElement('div');
    meetingCard.className = 'meeting-card';
    meetingCard.innerHTML = `
      <div class="d-flex justify-content-between align-items-start mt-4">
        <div>
          <h4 class="fw-500">${title}</h4>
          <p class="text-muted mt-3">
            <span class="fa-solid fa-clock me-2 fa-fw"></span>${timeString}
          </p>
          <p class="text-muted mb-0">
            <span class="fa-solid fa-map-marker-alt me-2 fa-fw"></span>${location}
          </p>
        </div>
        ${isVirtual 
          ? `<a href="${link}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-teal text-white">Join</a>`
          : `<button class="btn btn-sm btn-outline-teal">RSVP</button>`
        }
      </div>
    `;
    
    container.appendChild(meetingCard);
  }
  
  // Renders a comment card in the comments list
  static renderCommentCard(comment, container) {
    const attributes = comment.attributes || {};
    const content = attributes.content || '';
    const createdAt = attributes.created_at ? new Date(attributes.created_at) : null;
    const user = attributes.user || {};
    const firstName = user.first_name || 'Anonymous';
    const lastName = user.last_name || 'User';
    const email = user.email || '';
    
    // Generate initials
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    
    // Format the time
    let timeAgo = 'Recently';
    if (createdAt) {
      timeAgo = this.getTimeAgo(createdAt);
    }
    
    // Create the comment card HTML
    const commentCard = document.createElement('div');
    commentCard.className = 'd-flex mt-4';
    commentCard.innerHTML = `
      <div class="member-avatar rounded-circle text-white me-3">${initials}</div>
      <div class="flex-grow-1">
        <p class="fw-500 mb-2">${firstName} ${lastName}</p>
        <div class="comment-bubble">
          <p class="mt-4 fw-500 mb-1">${content}</p>
          <p class="smaller text-muted">${timeAgo}</p>
        </div>
      </div>
    `;
    
    container.appendChild(commentCard);
  }
  
  // Helper method to calculate time ago
  static getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      // Format as date for older comments
      return date.toLocaleDateString();
    }
  }
}

export default StudyGroupDetailService;