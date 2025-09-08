// YouTube utility functions
export function getYouTubeId(rawUrl: string): string | null {
    if (!rawUrl) return null;

    const url = rawUrl.trim();

    // Prefer robust URL parsing first
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase();
        const path = u.pathname.replace(/\/+$/, '');

        if (host.includes('youtu.be')) {
            const parts = path.split('/').filter(Boolean);
            if (parts.length >= 1) return parts[0];
        }

        if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
            const vParam = u.searchParams.get('v');
            if (vParam) return vParam;

            const parts = path.split('/').filter(Boolean);
            // /embed/{id}, /shorts/{id}, /live/{id}
            const known = ['embed', 'shorts', 'live'];
            const idx = parts.findIndex(p => known.includes(p.toLowerCase()));
            if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
        }
    } catch {
        // fall back to regexes below
    }

    // Regex fallbacks (case-insensitive, tolerant of www/m)
    const patterns = [
        /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?v=([^&\n?#]+)/i,
        /(?:https?:\/\/)?(?:www\.|m\.)?youtu\.be\/([^&\n?#]+)/i,
        /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/embed\/([^&\n?#]+)/i,
        /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([^&\n?#]+)/i,
        /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/live\/([^&\n?#]+)/i,
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
    } as const;

    const qualityCode = qualityMap[quality];
    return `https://img.youtube.com/vi/${videoId}/${qualityCode}.jpg`;
}

export function isYouTubeUrl(rawUrl: string): boolean {
    if (!rawUrl) return false;
    const id = getYouTubeId(rawUrl);
    if (id) return true;
    try {
        const u = new URL(rawUrl.trim());
        const host = u.hostname.toLowerCase();
        return host.includes('youtube.com') || host.includes('youtu.be') || host.includes('youtube-nocookie.com');
    } catch {
        return false;
    }
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
