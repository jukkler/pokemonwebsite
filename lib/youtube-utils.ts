/**
 * YouTube URL Utilities
 * Parsing und Validierung von YouTube-URLs für Stream-Einbettungen
 */

/**
 * Extrahiert die Video-ID aus verschiedenen YouTube-URL-Formaten
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Gibt die YouTube-Embed-URL zurück
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
}

/**
 * Prüft ob eine URL eine gültige YouTube-URL ist
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}
