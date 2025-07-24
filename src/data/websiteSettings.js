export const websiteURL = 'quran.zikirnurani.com';

export const websiteTagline = 'An all-in-one platform for Quranic learning and built with love for the people of Sabah';

export const websiteTitle = `Digital Dakwah - ${websiteTagline}`;

export const wbwLanguages = 'English, Urdu, Hindi, Indonesian, Bangla, Turkish, Tamil, French, German, Chinese, Malayalam, Divehi, Sindhi, Persian and Albanian';

export const apiVersion = 141;

export const useLocalAPI = false;

export const apiEndpoint = useLocalAPI ? 'http://localhost:7500/v2' : 'https://api.quranwbw.com/v2';

export const staticEndpoint = 'https://static.quranwbw.com/data/v4';

// Updated to use Cloudflare R2 with custom domain
export const wordsAudioURL = 'https://audio.zikirnurani.com/words';

// Alternative: Direct R2 URL (if custom domain not set up yet)
// export const wordsAudioURL = 'https://pub-your-r2-bucket-id.r2.dev/words';

// Backup audio URL
export const backupAudioURL = 'https://audios.quranwbw.com/words';

export const mushafFontVersion = 8;

export const mushafWordFontLink = `${staticEndpoint}/fonts/Hafs/KFGQPC-v4/COLRv1`;

export const mushafHeaderFontLink = `${staticEndpoint}/fonts/Extras/chapter-headers/QCF_SurahHeader_COLOR-Regular.woff2`;

export const splitDelimiter = '||';
