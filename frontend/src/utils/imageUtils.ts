/**
 * Utility function to get the correct image URL
 * Handles both relative paths (/uploads/...) and full URLs
 */
export const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  
  // If it's already a full URL (http/https), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative path starting with /uploads
  if (url.startsWith('/uploads')) {
    // In development, try using the proxy first (relative path)
    // If that fails, the onError handler will try the full backend URL
    // For now, we'll use the full backend URL to avoid CORS issues
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${backendUrl}${url}`;
  }
  
  // Return as is for other relative paths
  return url;
};

