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
	// Option 1: Enhanced Cloudflare Worker with KV caching (primary) - DISABLED DUE TO 404 ERRORS
	workerUrl: 'https://digitalquranaudio.zikirnurani.com',
	
	// Option 2: Fallback worker URL  
	fallbackWorkerUrl: 'https://quran-api-proxy-production.rodhirahman30.workers.dev',
	
	// Option 3: Public CORS proxies as last resort
	publicProxies: [
		'https://api.allorigins.win/raw?url=',
		'https://corsproxy.io/?',
		'https://cors-anywhere.herokuapp.com/'
	],
	
	// Re-enable proxy for production (using fallback worker)
	useProxy: isProduction
};

// Helper function to get API URL with proxy if needed
export function getApiUrl(url) {
	if (!corsProxyConfig.useProxy) {
		return url;
	}
	
	// Try public CORS proxy (more reliable)
	console.log(`Using public CORS proxy for: ${url}`);
	return `${corsProxyConfig.publicProxies[0]}${encodeURIComponent(url)}`;
}

// Helper function specifically for audio URLs (tries multiple approaches)
export function getAudioUrl(url) {
	if (!corsProxyConfig.useProxy) {
		return url;
	}
	
	// everyayah.com works directly - no proxy needed
	if (url.includes('everyayah.com')) {
		return url;
	}
	
	// Local audio files (word-by-word-audio) work directly - no proxy needed
	if (url.includes('/word-by-word-audio')) {
		return url;
	}
	
	// For external audio sources that might need proxy, use public CORS proxy
	if (url.includes('audios.quranwbw.com')) {
		console.log(`Using public CORS proxy for audio: ${url}`);
		return `${corsProxyConfig.publicProxies[0]}${encodeURIComponent(url)}`;
	}
	
	// Default: return original URL
	return url;
}

export const apiEndpoint = useLocalAPI ? 'http://localhost:7500/v2' : 'https://api.quranwbw.com/v2';

export const staticEndpoint = 'https://static.quranwbw.com/data/v4';

export const wordsAudioURL = '/word-by-word-audio';

export const backupAudioURL = 'https://audios.quranwbw.com/words';

export const mushafFontVersion = 8;

export const mushafWordFontLink = `${staticEndpoint}/fonts/Hafs/KFGQPC-v4/COLRv1`;

export const mushafHeaderFontLink = `${staticEndpoint}/fonts/Extras/chapter-headers/QCF_SurahHeader_COLOR-Regular.woff2`;

export const splitDelimiter = '||';
