// YouTube utility functions
export function getYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/,
        /youtube\.com\/live\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

export function getYouTubeThumbnail(url: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'): string | null {
    const videoId = getYouTubeId(url);
    if (!videoId) return null;

    // YouTube thumbnail quality options
    const qualityMap = {
        default: 'default',
        medium: 'mqdefault',
        high: 'hqdefault',
        standard: 'sddefault',
        maxres: 'maxresdefault'
    };

    const qualityCode = qualityMap[quality];
    return `https://img.youtube.com/vi/${videoId}/${qualityCode}.jpg`;
}

export function isYouTubeUrl(url: string): boolean {
    return getYouTubeId(url) !== null;
}

export function isVimeoUrl(url: string): boolean {
    return /vimeo\.com\/(\d+)/.test(url);
}

export function getVimeoThumbnail(url: string): string | null {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (!match) return null;

    const videoId = match[1];
    // Note: Vimeo requires API call for thumbnails, but we can use a placeholder
    // or implement a server-side function to fetch the thumbnail
    return `https://vumbnail.com/${videoId}.jpg`;
}
