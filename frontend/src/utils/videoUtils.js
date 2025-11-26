/**
 * Utility functions for video handling
 */
// Extract YouTube video ID from various URL formats
export const getYouTubeVideoId = (url) => {
    if (!url)
        return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
};
// Check if URL is a YouTube video
export const isYouTubeUrl = (url) => {
    return /youtube\.com|youtu\.be/.test(url);
};
// Get YouTube embed URL
export const getYouTubeEmbedUrl = (url) => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
};
// Get YouTube thumbnail URL
export const getYouTubeThumbnail = (url) => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return null;
};
