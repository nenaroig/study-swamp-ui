class StatsService {
  
  // Calculates statistics from meetings and groups data
  static calculateStats(meetings = [], groups = []) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Count meetings for today
    const todaysMeetings = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.attributes?.start_time);
      return meetingDate >= today && meetingDate < tomorrow;
    });
    
    // Count all upcoming meetings
    const upcomingMeetings = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.attributes?.start_time);
      return meetingDate >= now;
    });
    
    // Count groups by department
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
  
  // Creates a single statistics card element from template
  static createStatsCard(title, value, subtitle = '', iconClass = '') {
    const template = document.getElementById('stats-card-template');
    const clone = template.content.cloneNode(true);
    
    clone.querySelector('.stats-icon').className = `stats-icon fa-2x text-teal ${iconClass}`;
    clone.querySelector('.stats-value').textContent = value;
    clone.querySelector('.stats-title').textContent = title;
    clone.querySelector('.stats-subtitle').textContent = subtitle;
    
    return clone;
  }
  
  // Renders complete statistics dashboard into specified container
  static renderStats(meetings = [], groups = [], containerId = 'stats-container') {
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }
    
    container.innerHTML = '';
    
    const stats = this.calculateStats(meetings, groups);
    
    const statsCards = [
      {
        title: `${stats.departments === 1 ? 'Study Group' : 'Study Groups'}`,
        value: stats.totalGroups,
        subtitle: `Across ${stats.departments} ${stats.departments === 1 ? 'department' : 'departments'}`,
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
        title: `${stats.departments === 1 ? 'Department' : 'Departments'}`,
        value: stats.departments === 1 ? Object.keys(stats.departmentCounts)[0] : `${stats.departments}`,
        subtitle: this.formatDepartmentBreakdown(stats.departmentCounts),
        iconClass: 'fa-solid fa-building-user'
      }
    ];
    
    const row = document.createElement('div');
    row.className = 'row';
    
    statsCards.forEach(cardData => {
      const card = this.createStatsCard(
        cardData.title,
        cardData.value,
        cardData.subtitle,
        cardData.iconClass
      );
      row.appendChild(card);
    });
    
    container.appendChild(row);
  }
  
  // @todo: Need to format this to better...
  // Formats department breakdown for display
  static formatDepartmentBreakdown(departmentCounts) {
    const entries = Object.entries(departmentCounts);
    
    if (entries.length === 0) return '';
    if (entries.length === 1) return `${entries[0][1]} group`;
    
    return entries
      .map(([dept, count]) => `${dept}(${count})`)
      .join(', ');
  }
  
  // Refreshes statistics display with updated data
  static refreshStats(meetings, groups, containerId = 'stats-container') {
    this.renderStats(meetings, groups, containerId);
  }
}

export default StatsService;