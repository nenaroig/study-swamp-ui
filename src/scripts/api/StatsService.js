/**
 * StatsService - Service for calculating and displaying dashboard statistics
 * 
 * Provides functionality for:
 * - Calculating statistics from meetings and study groups data
 * - Rendering statistics cards in the dashboard UI
 * - Formatting statistical information for display
 * - Creating interactive dashboard components
 * 
 * This service analyzes data to provide insights such as:
 * - Meeting counts (today's meetings, upcoming meetings)
 * - Study group statistics (total groups, department breakdown)
 * - Department distribution and analysis
 * 
 * Does not extend BaseService as it has specialized statistical functionality
 * that doesn't follow the typical item-list rendering pattern.
 * 
 * @static
 */

class StatsService {
  
  /* ======= CALCULATIONS ======= */
  
  /**
   * Calculates comprehensive statistics from meetings and study groups data
   * Analyzes temporal data for meetings and categorical data for groups
   * 
   * @param {Array} meetings - Array of meeting objects (default: [])
   * @param {Array} groups - Array of study group objects (default: [])
   * @returns {Object} Statistics object containing:
   *   @returns {number} totalGroups - Total number of study groups
   *   @returns {number} todaysMeetings - Number of meetings scheduled for today
   *   @returns {number} upcomingMeetings - Number of meetings scheduled in the future
   *   @returns {Object} departmentCounts - Object with department names as keys and counts as values
   *   @returns {number} departments - Number of unique departments
   * 
   * @example
   * const meetings = [
   *   { attributes: { start_time: '2025-07-06T14:00:00Z' } },
   *   { attributes: { start_time: '2025-07-07T10:00:00Z' } }
   * ];
   * const groups = [
   *   { attributes: { department: 'Computer Science' } },
   *   { attributes: { department: 'Mathematics' } }
   * ];
   * const stats = StatsService.calculateStats(meetings, groups);
   * // Returns: { totalGroups: 2, todaysMeetings: 1, upcomingMeetings: 2, ... }
   */
  static calculateStats(meetings = [], groups = []) {
    const now = new Date();
    // Create date boundaries for "today" (start of day to start of next day)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Count meetings scheduled for today (between start of today and start of tomorrow)
    const todaysMeetings = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.attributes?.start_time);
      return meetingDate >= today && meetingDate < tomorrow;
    });
    
    // Count all meetings scheduled for the future (after current moment)
    const upcomingMeetings = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.attributes?.start_time);
      return meetingDate >= now;
    });
    
    // Calculate group statistics by department
    const departmentCounts = groups.reduce((acc, group) => {
      const dept = group.attributes?.department || 'Other';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalGroups: groups.length,
      todaysMeetings: todaysMeetings.length,
      upcomingMeetings: upcomingMeetings.length,
      departmentCounts: departmentCounts,
      departments: Object.keys(departmentCounts).length
    };
  }
  
  /* ======= DISPLAY/RENDERING ======= */
  
  /**
   * Creates a single statistics card element from template
   * 
   * @param {string} title - Main title for the statistics card
   * @param {string|number} value - Primary value to display
   * @param {string} subtitle - Secondary description text (default: '')
   * @param {string} iconClass - CSS class for FontAwesome icon (default: '')
   * @returns {DocumentFragment} Cloned and populated statistics card element
   * 
   * @example
   * const card = StatsService.createStatsCard(
   *   'Total Groups', 
   *   15, 
   *   'across 3 departments', 
   *   'fa-solid fa-user-group'
   * );
   */
  static createStatsCard(title, value, subtitle = '', iconClass = '') {
    // Get the statistics card template
    const template = document.getElementById('stats-card-template'),
    clone = template.content.cloneNode(true);
    
    // Configure the icon with base classes and custom icon class
    clone.querySelector('.stats-icon').className = `stats-icon fa-lg text-teal ${iconClass}`;
    
    // Populate the card content
    clone.querySelector('.stats-value').textContent = value;
    clone.querySelector('.stats-title').textContent = title;
    clone.querySelector('.stats-subtitle').textContent = subtitle;
    
    return clone;
  }
  
  /**
   * Renders complete statistics dashboard into specified container
   * Calculates statistics and creates a set of predefined statistics cards
   * 
   * @param {Array} meetings - Array of meeting objects (default: [])
   * @param {Array} groups - Array of study group objects (default: [])
   * @param {string} containerId - ID of DOM element to render into (default: 'stats-container')
   * 
   * @example
   * StatsService.renderStats(meetingsData, groupsData, 'dashboard-stats');
   */
  static renderStats(meetings = [], groups = [], containerId = 'stats-container') {
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }
    
    // Clear existing content to prevent duplication
    container.innerHTML = '';
    
    // Calculate all statistics from the provided data
    const stats = this.calculateStats(meetings, groups);
    
    // Define the statistics cards to display
    const statsCards = [
      {
        title: 'Study Groups',
        value: stats.totalGroups,
        subtitle: `Across ${stats.departments} departments`,
        iconClass: 'fa-solid fa-user-group'
      },
      {
        title: 'Today\'s Meetings',
        value: stats.todaysMeetings,
        subtitle: stats.todaysMeetings === 1 ? 'meeting scheduled' : 'meetings scheduled',
        iconClass: 'fa-regular fa-calendar-check'
      },
      {
        title: 'Upcoming Meetings',
        value: stats.upcomingMeetings,
        subtitle: 'total scheduled',
        iconClass: 'fa-regular fa-clock'
      },
      {
        title: 'Departments',
        // Display comma-separated list of department names, or empty
        value: Object.keys(stats.departmentCounts).join(', ') || '',
        subtitle: this.formatDepartmentBreakdown(stats.departmentCounts),
        iconClass: 'fa-solid fa-building-user'
      }
    ];
    
    // Create Bootstrap row wrapper for responsive layout
    const row = document.createElement('div');
    row.className = 'row';
    
    // Create and append each statistics card
    statsCards.forEach(cardData => {
      const card = this.createStatsCard(
        cardData.title,
        cardData.value,
        cardData.subtitle,
        cardData.iconClass
      );
      row.appendChild(card);
    });
    
    // Add the complete row to the container
    container.appendChild(row);
  }
  
  /**
   * Formats department breakdown information for display
   * Creates a human-readable summary of group distribution across departments
   * 
   * @param {Object} departmentCounts - Object with department names as keys and counts as values
   * @returns {string} Formatted breakdown string
   * 
   * @example
   * const counts = { 'Computer Science': 5, 'Mathematics': 3, 'Physics': 2 };
   * const breakdown = StatsService.formatDepartmentBreakdown(counts);
   * // Returns: "Computer Science(5), Mathematics(3), Physics(2)"
   * 
   * @example
   * const counts = { 'Mathematics': 1 };
   * const breakdown = StatsService.formatDepartmentBreakdown(counts);
   * // Returns: "1 group"
   * 
   * @example
   * const counts = {};
   * const breakdown = StatsService.formatDepartmentBreakdown(counts);
   * // Returns: ""
   */
  static formatDepartmentBreakdown(departmentCounts) {
    const entries = Object.entries(departmentCounts);
    
    // Handle empty case
    if (entries.length === 0) return '';
    
    // Handle single department case with special formatting
    if (entries.length === 1) return `${entries[0][1]} group`;
    
    // Handle multiple departments - format as "Department(count)" pairs
    return entries
      .map(([dept, count]) => `${dept}(${count})`)
      .join(', ');
  }
  
  /* ======= UTILITIES ======= */
  
  /**
   * Convenience method to refresh statistics display
   * Wrapper around renderStats for easier calling when data updates
   * 
   * @param {Array} meetings - Updated array of meeting objects
   * @param {Array} groups - Updated array of study group objects  
   * @param {string} containerId - ID of DOM element to render into (default: 'stats-container')
   * 
   * @example
   * // After fetching new data
   * const updatedMeetings = await MeetingService.getUpcomingMeetingsFiltered();
   * const updatedGroups = await StudyGroupsService.getMyStudyGroups();
   * StatsService.refreshStats(updatedMeetings.meetingData, updatedGroups.studyGroupsData);
   */
  static refreshStats(meetings, groups, containerId = 'stats-container') {
    this.renderStats(meetings, groups, containerId);
  }
}

export default StatsService;