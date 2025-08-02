class StatsService {
  
  // Calculates statistics from all groups and user's groups
  static calculateStats(allGroups = [], userGroups = [], meetings = []) {
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
    
    // Count user's groups by department
    const departmentCounts = userGroups.reduce((acc, group) => {
      const dept = group.attributes?.department || 'Other';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    
    return {
      myGroups: userGroups.length,
      totalAvailableGroups: allGroups.length,
      todaysMeetings: todaysMeetings.length,
      upcomingMeetings: upcomingMeetings.length,
      departmentCounts: departmentCounts,
      departments: Object.keys(departmentCounts).length
    };
  }
  
  // Creates a single statistics card element
  static createStatsCard({ title, value, subtitle = '', iconClass = '', cardClass = 'col-md-4', onClick = null, clickable = false }) {
    const cardContainer = document.createElement('div');
    cardContainer.className = `${cardClass} mt-4`;
    
    const card = document.createElement('div');
    card.className = `bg-white rounded-4 p-4 h-100 text-center${clickable ? ' pointer' : ''}`;
    
    // Add clickable styling and cursor if clickable
    if (clickable && onClick) {
      card.addEventListener('click', onClick);
    }
    
    if (iconClass) {
      const icon = document.createElement('span');
      icon.className = `${iconClass} fa-2x text-teal`;
      card.appendChild(icon);
    }
    
    const valueElement = document.createElement('h2');
    valueElement.className = 'text-gator-accent mt-2';
    valueElement.textContent = value;
    card.appendChild(valueElement);
    
    const titleElement = document.createElement('div');
    titleElement.className = 'fw-semibold';
    titleElement.textContent = title;
    card.appendChild(titleElement);
    
    if (subtitle) {
      const subtitleElement = document.createElement('div');
      subtitleElement.className = 'text-muted small mt-1';
      subtitleElement.textContent = subtitle;
      card.appendChild(subtitleElement);
    }
    
    cardContainer.appendChild(card);
    return cardContainer;
  }
  
  // Helper method for awards - determines next milestone
  static getNextMilestone(userAwards = [], allAwards = []) {
    const earnedAwardIds = userAwards.map(award => award.id);
    const unearned = allAwards.filter(award => !earnedAwardIds.includes(award.id));
    
    if (unearned.length === 0) return 'All Complete!';
    
    // Return the next logical award based on typical progression
    const progressionOrder = ['egg_tooth', 'first_splash', 'snap_to_it', 'tailgator', 'gator_done', 'chomp_champ'];
    const nextAward = unearned.find(award => progressionOrder.includes(award.id));
    
    return nextAward ? nextAward.name : unearned[0].name;
  }
  
  // Predefined layouts for different pages
  static getLayouts() {
    return {
      studyGroups: (stats) => [
        {
          title: 'My Groups',
          value: stats.myGroups,
          subtitle: 'joined',
          iconClass: 'fa-solid fa-user-group'
        },
        {
          title: 'Meetings',
          value: stats.todaysMeetings,
          subtitle: 'today',
          iconClass: 'fa-regular fa-calendar-check'
        },
        {
          title: 'Available Groups',
          value: stats.totalAvailableGroups,
          subtitle: 'to join',
          iconClass: 'fa-solid fa-users'
        }
      ],
      
      dashboard: (stats) => [
        {
          title: 'Study Groups',
          value: stats.myGroups,
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
          title: 'Points Earned',
          value: stats.awardPoints || 0,
          subtitle: 'gator gold',
          iconClass: 'fa-solid fa-star'
        },
        {
          title: 'Available Groups',
          value: stats.totalAvailableGroups,
          subtitle: 'system wide',
          iconClass: 'fa-solid fa-building-user'
        }
      ],
      
      meetings: (stats) => [
        {
          title: 'Today\'s Meetings',
          value: stats.todaysMeetings,
          subtitle: 'scheduled for today',
          iconClass: 'fa-regular fa-calendar-check'
        },
        {
          title: 'Upcoming Meetings',
          value: stats.upcomingMeetings,
          subtitle: 'total upcoming',
          iconClass: 'fa-regular fa-clock'
        },
        {
          title: 'My Groups',
          value: stats.myGroups,
          subtitle: 'with meetings',
          iconClass: 'fa-solid fa-user-group'
        }
      ],
      
      studyGroup: (stats) => [
        {
          title: 'Members',
          value: stats.myGroups,
          subtitle: 'joined',
          iconClass: 'fa-solid fa-user-group'
        },
        {
          title: 'Meetings',
          value: stats.todaysMeetings,
          subtitle: 'today',
          iconClass: 'fa-regular fa-calendar-check'
        },
        {
          title: 'Comments',
          value: stats.totalAvailableGroups,
          subtitle: 'to join',
          iconClass: 'fa-solid fa-users'
        }
      ],
      
      awards: (stats) => [
        {
          title: 'Awards Earned',
          value: `${stats.earnedAwards || 0}/${stats.totalAwards || 0}`,
          subtitle: `${stats.completionRate || 0}% complete`,
          iconClass: 'fa-solid fa-trophy'
        },
        {
          title: 'Award Points',
          value: stats.awardPoints || 0,
          subtitle: `of ${stats.totalPossiblePoints || 0} possible`,
          iconClass: 'fa-solid fa-star'
        },
        {
          title: 'Next Milestone',
          value: stats.nextMilestone || 'Loading...',
          subtitle: 'achievement goal',
          iconClass: 'fa-solid fa-bullseye'
        }
      ]
    };
  }
  
  // Simple render method - handles everything automatically
  static renderStats(allGroups, options = {}) {
    const {
      containerId = 'stats-container',
      layout = 'studyGroups',
      userGroups = [],
      meetings = [],
      cardClass = 'col-md-4',
      currentUserId = null,
      clickHandlers = {},
      clickableCards = [],
      customStats = null
    } = options;
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }
    
    // Auto-filter user's groups if currentUserId provided and userGroups not explicitly passed
    let finalUserGroups = userGroups;
    if (currentUserId && userGroups.length === 0 && allGroups.length > 0) {
      finalUserGroups = [];
    }
    
    // Use custom stats if provided (for awards), otherwise calculate from groups/meetings
    const stats = customStats || this.calculateStats(allGroups, finalUserGroups, meetings);
    const layouts = this.getLayouts();
    
    if (!layouts[layout]) {
      console.error(`Unknown layout: ${layout}`);
      return;
    }
    
    const cardsToRender = layouts[layout](stats);
    
    // Clear and render
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'row';
    
    cardsToRender.forEach((cardData, index) => {
      const cardTitle = cardData.title.toLowerCase().replace(/['\s]/g, '');
      const isClickable = clickableCards.includes(cardTitle) || clickableCards.includes(index);
      const clickHandler = clickHandlers[cardTitle] || clickHandlers[index];
      
      const card = this.createStatsCard({
        ...cardData,
        cardClass,
        clickable: isClickable,
        onClick: clickHandler
      });
      wrapper.appendChild(card);
    });
    
    container.appendChild(wrapper);
  }
  
  // For when you have members data and want automatic filtering
  static renderStatsWithMembers(allGroups, members, currentUserId, options = {}) {
    // Filter user's groups automatically
    const userGroupIds = members
    .filter(member => member.relationships.user.data.id === currentUserId.toString())
    .map(member => member.relationships.group.data.id);
    
    const userGroups = allGroups.filter(group => userGroupIds.includes(group.id));
    
    this.renderStats(allGroups, {
      ...options,
      userGroups
    });
  }
  
  // Specialized method for rendering awards stats
  static renderAwardsStats(containerId, userAwards = [], allAwards = [], options = {}) {
    const totalPoints = userAwards.reduce((sum, award) => sum + (award.points || 0), 0);
    const totalPossiblePoints = allAwards.reduce((sum, award) => sum + (award.points || 0), 0);
    const completionRate = allAwards.length > 0 ? Math.round((userAwards.length / allAwards.length) * 100) : 0;
    const nextMilestone = this.getNextMilestone(userAwards, allAwards);
    
    const customStats = {
      earnedAwards: userAwards.length,
      totalAwards: allAwards.length,
      awardPoints: totalPoints,
      totalPossiblePoints: totalPossiblePoints,
      completionRate: completionRate,
      nextMilestone: nextMilestone
    };
    
    this.renderStats([], {
      containerId,
      layout: 'awards',
      cardClass: options.cardClass || 'col-md-4',
      customStats,
      clickHandlers: options.clickHandlers || {},
      clickableCards: options.clickableCards || []
    });
  }
  
  // Update specific card values without re-rendering
  static updateCard(containerId, cardIndex, newValue, newSubtitle = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const cards = container.querySelectorAll('.bg-white.rounded-4');
    if (cards[cardIndex]) {
      const valueElement = cards[cardIndex].querySelector('h2');
      if (valueElement) valueElement.textContent = newValue;
      
      if (newSubtitle) {
        const subtitleElement = cards[cardIndex].querySelector('.small');
        if (subtitleElement) subtitleElement.textContent = newSubtitle;
      }
    }
  }
}

export default StatsService;