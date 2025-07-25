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
	// Option 1: Try multiple public CORS proxies
	publicProxies: [
		'https://api.allorigins.win/raw?url=',
		'https://corsproxy.io/?',
		'https://cors-anywhere.herokuapp.com/'
	],
	
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
	
	// Try the first available public proxy
	const primaryProxy = corsProxyConfig.publicProxies[0];
	console.log(`Using public CORS proxy for: ${url}`);
	return `${primaryProxy}${encodeURIComponent(url)}`;
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
	
	// For other audio sources (like audios.quranwbw.com), try public proxy
	if (url.includes('audios.quranwbw.com')) {
		console.log(`Using CORS proxy for audio: ${url}`);
		const primaryProxy = corsProxyConfig.publicProxies[0];
		return `${primaryProxy}${encodeURIComponent(url)}`;
	}
	
	// Default: return original URL
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
