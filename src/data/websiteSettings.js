export const websiteURL = 'QuranWBW.com';

export const websiteTagline = 'Word By Word Translation, Transliteration And Morphology';

export const websiteTitle = `Quran ${websiteTagline} - ${websiteURL}`;

export const wbwLanguages = 'English, Urdu, Hindi, Indonesian, Bangla, Turkish, Tamil, French, German, Chinese, Malayalam, Divehi, Sindhi, Persian and Albanian';

export const apiVersion = 141;

export const useLocalAPI = false;

// Check if we're in production (any deployed site, not localhost)
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');

// CORS Proxy Configuration
export const corsProxyConfig = {
	// Option 1: Public CORS Proxy (primary - more reliable)
	publicProxy: 'https://api.allorigins.win/raw?url=',
	
	// Option 2: Cloudflare Worker (fallback if available)
	workerUrl: 'https://quran-api-proxy.rodhirahman30.workers.dev',
	
	// Custom domain worker (when DNS is properly configured)
	fallbackWorkerUrl: 'https://digitalquranaudio.zikirnurani.com',
	
	// Use proxy in production
	useProxy: isProduction
};

// Helper function to get API URL with proxy if needed
export function getApiUrl(url) {
	if (!corsProxyConfig.useProxy) {
		return url;
	}
	
	// Use public CORS proxy as primary (more reliable for restricted APIs)
	console.log(`Using public CORS proxy for: ${url}`);
	return `${corsProxyConfig.publicProxy}${encodeURIComponent(url)}`;
}

// Helper function specifically for audio URLs (tries multiple approaches)
export function getAudioUrl(url) {
	if (!corsProxyConfig.useProxy) {
		return url;
	}
	
	// For audio files, try direct access first (many audio CDNs allow direct access)
	// If that fails, the audio player will handle the error
	return url;
}

export const apiEndpoint = useLocalAPI ? 'http://localhost:7500/v2' : 'https://api.quranwbw.com/v2';

export const staticEndpoint = 'https://static.quranwbw.com/data/v4';

export const wordsAudioURL = 'https://audios.quranwbw.com/words';

export const backupAudioURL = '/word-by-word-audio';

export const mushafFontVersion = 8;

export const mushafWordFontLink = `${staticEndpoint}/fonts/Hafs/KFGQPC-v4/COLRv1`;

export const mushafHeaderFontLink = `${staticEndpoint}/fonts/Extras/chapter-headers/QCF_SurahHeader_COLOR-Regular.woff2`;

export const splitDelimiter = '||';
