export const websiteURL = 'QuranWBW.com';

export const websiteTagline = 'Word By Word Translation, Transliteration And Morphology';

export const websiteTitle = `Quran ${websiteTagline} - ${websiteURL}`;

export const wbwLanguages = 'English, Urdu, Hindi, Indonesian, Bangla, Turkish, Tamil, French, German, Chinese, Malayalam, Divehi, Sindhi, Persian and Albanian';

export const apiVersion = 141;

export const useLocalAPI = false;

// Check if we're in production (your custom domain)
const isProduction = typeof window !== 'undefined' && window.location.hostname === 'quran.zikirnurani.com';

// CORS Proxy Configuration
export const corsProxyConfig = {
	// Option 1: Cloudflare Worker (RECOMMENDED - replace with your worker URL)
	workerUrl: 'https://your-worker-name.your-subdomain.workers.dev',
	
	// Option 2: Public CORS Proxy (current fallback)
	publicProxy: 'https://api.allorigins.win/raw?url=',
	
	// Use proxy in production
	useProxy: isProduction
};

// Helper function to get API URL with proxy if needed
export function getApiUrl(url) {
	if (!corsProxyConfig.useProxy) {
		return url;
	}
	
	// Try Cloudflare Worker first (if configured)
	if (corsProxyConfig.workerUrl && !corsProxyConfig.workerUrl.includes('your-worker-name')) {
		// Extract host and path from URL for worker format
		const urlObj = new URL(url);
		return `${corsProxyConfig.workerUrl}/${urlObj.host}${urlObj.pathname}${urlObj.search}`;
	}
	
	// Fallback to public proxy
	console.log(`Using CORS proxy for: ${url}`);
	return `${corsProxyConfig.publicProxy}${encodeURIComponent(url)}`;
}

export const apiEndpoint = useLocalAPI ? 'http://localhost:7500/v2' : 'https://api.quranwbw.com/v2';

export const staticEndpoint = 'https://static.quranwbw.com/data/v4';

export const wordsAudioURL = 'https://audios.quranwbw.com/words';

export const mushafFontVersion = 8;

export const mushafWordFontLink = `${staticEndpoint}/fonts/Hafs/KFGQPC-v4/COLRv1`;

export const mushafHeaderFontLink = `${staticEndpoint}/fonts/Extras/chapter-headers/QCF_SurahHeader_COLOR-Regular.woff2`;

export const splitDelimiter = '||';
