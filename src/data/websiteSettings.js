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
	// Option 1: Cloudflare Worker (using workers.dev temporarily until custom domain is configured)
	workerUrl: 'https://quran-api-proxy.rodhirahman30.workers.dev',
	
	// Custom domain worker (when DNS is properly configured)
	fallbackWorkerUrl: 'https://digitalquranaudio.zikirnurani.com',
	
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
	
	// Try Cloudflare Worker first (custom domain or workers.dev)
	const workerUrl = corsProxyConfig.workerUrl || corsProxyConfig.fallbackWorkerUrl;
	if (workerUrl && !workerUrl.includes('your-worker-name')) {
		// Extract host and path from URL for worker format
		const urlObj = new URL(url);
		const workerProxyUrl = `${workerUrl}/${urlObj.host}${urlObj.pathname}${urlObj.search}`;
		console.log(`Using Cloudflare Worker proxy: ${workerProxyUrl}`);
		return workerProxyUrl;
	}
	
	// Fallback to public proxy
	console.log(`Using public CORS proxy for: ${url}`);
	return `${corsProxyConfig.publicProxy}${encodeURIComponent(url)}`;
}

export const apiEndpoint = useLocalAPI ? 'http://localhost:7500/v2' : 'https://api.quranwbw.com/v2';

export const staticEndpoint = 'https://static.quranwbw.com/data/v4';

export const wordsAudioURL = 'https://audios.quranwbw.com/words';

export const mushafFontVersion = 8;

export const mushafWordFontLink = `${staticEndpoint}/fonts/Hafs/KFGQPC-v4/COLRv1`;

export const mushafHeaderFontLink = `${staticEndpoint}/fonts/Extras/chapter-headers/QCF_SurahHeader_COLOR-Regular.woff2`;

export const splitDelimiter = '||';
