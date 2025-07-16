/**
 * URLHelpers - Utility functions for URL handling
 * Provides consistent URL generation across the application
 */

// Convert group name to URL-friendly slug
export function createGroupSlug(groupName) {
  if (!groupName) return 'unknown-group';
  return groupName.toLowerCase().replace(/\s+/g, '-');
}

// Create full URL for a group
export function createGroupUrl(groupName) {
  const slug = createGroupSlug(groupName);
  return `/groups/${slug}`;
}

// Extract group slug from current URL
export function getGroupSlugFromUrl() {
  const path = window.location.pathname;
  const matches = path.match(/^\/groups\/([^\/]+)$/);
  return matches ? matches[1] : null;
}
