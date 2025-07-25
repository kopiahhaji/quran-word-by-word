/**
 * KV-Based Quran Data Adapter
 * 
 * Uses Cloudflare KV storage for fast, reliable Quran data access
 * with multilingual translation support (English, Malay, Brunei, Tagalog, Chinese)
 */

import { splitDelimiter } from '$data/websiteSettings';
import { getApiUrl } from '$data/websiteSettings';

/**
 * Fetch chapter data from KV storage via worker
 * @param {number} chapterNumber - Chapter number (1-114)
 * @returns {Object} Chapter data in app format with multilingual support
 */
export async function fetchFromKV(chapterNumber) {
	try {
		console.log(`🔄 Fetching multilingual chapter ${chapterNumber} from KV storage...`);
		
		// Temporarily disable KV fetching - direct fallback to null
		console.log('⚠️ KV fetching temporarily disabled due to proxy issues');
		return null;
		
		// Use your existing worker endpoint but with KV path
		// const kvURL = getApiUrl(`/kv/chapter/${chapterNumber}`);
		
		// const response = await fetch(kvURL);
		
		if (!response.ok) {
			throw new Error(`KV fetch failed: ${response.status} ${response.statusText}`);
		}
		
		const data = await response.json();
		
		if (data && data.verses) {
			console.log(`✅ KV multilingual fetch successful for chapter ${chapterNumber}: ${Object.keys(data.verses).length} verses with languages: ${data.metadata?.languages?.join(', ') || 'Arabic, English, Malay, Brunei, Tagalog, Chinese'}`);
			return data.verses;
		} else {
			throw new Error('Invalid KV response format');
		}
		
	} catch (error) {
		console.warn(`❌ KV fetch failed for chapter ${chapterNumber}:`, error);
		return null;
	}
}

/**
 * Get specific translation for a verse from KV data
 * @param {Object} verseData - Verse data from KV
 * @param {string} language - Language code (english, malay, brunei, tagalog, chinese)
 * @returns {string} Translation text
 */
export function getTranslationFromKV(verseData, language = 'english') {
	if (!verseData?.translations) return '';
	
	// Map language codes to internal structure
	const languageMap = {
		'english': 'english',
		'malay': 'malay', 
		'brunei': 'brunei',
		'tagalog': 'tagalog',
		'chinese': 'chinese',
		'en': 'english',
		'ms': 'malay',
		'tl': 'tagalog',
		'zh': 'chinese'
	};
	
	const mappedLang = languageMap[language.toLowerCase()] || 'english';
	return verseData.translations[mappedLang] || verseData.translations.english || '';
}

/**
 * Get word-by-word data from KV in the format expected by the app
 * @param {Object} verseData - Verse data from KV
 * @returns {Object} Word arrays (arabic, english, transliteration)
 */
export function getWordsFromKV(verseData) {
	if (!verseData?.words) return { arabic: [], english: [], transliteration: [] };
	
	return {
		arabic: verseData.words.arabic ? verseData.words.arabic.split('|') : [],
		english: verseData.words.english ? verseData.words.english.split('|') : [], 
		transliteration: verseData.words.transliteration ? verseData.words.transliteration.split('|') : []
	};
}

/**
 * Transform JSDelivr data for storage in KV
 * @param {Array} jsdelivrData - Full JSDelivr dataset
 * @param {number} chapterNumber - Chapter to extract
 * @returns {Object} Transformed chapter data ready for KV storage
 */
export function prepareChapterForKV(jsdelivrData, chapterNumber) {
	if (!jsdelivrData || !chapterNumber) {
		throw new Error('Invalid parameters for KV preparation');
	}

	console.log(`🔄 Preparing chapter ${chapterNumber} for KV storage...`);
	const transformedVerses = {};
	
	// JSDelivr is organized by pages, need to search through all pages
	for (let pageIndex = 0; pageIndex < jsdelivrData.length; pageIndex++) {
		const pageData = jsdelivrData[pageIndex];
		if (!pageData || !pageData.ayahs) continue;
		
		for (const ayah of pageData.ayahs) {
			if (!ayah.words || ayah.words.length === 0) continue;
			
			// Group words by verse
			const wordsByVerse = {};
			
			for (const word of ayah.words) {
				if (!word || !word.parentAyahVerseKey) continue;
				
				const verseKey = word.parentAyahVerseKey;
				const [chapter, verse] = verseKey.split(':');
				
				if (parseInt(chapter) !== chapterNumber) continue;
				
				if (!wordsByVerse[verseKey]) {
					wordsByVerse[verseKey] = [];
				}
				wordsByVerse[verseKey].push(word);
			}
			
			// Transform each verse
			for (const [verseKey, words] of Object.entries(wordsByVerse)) {
				if (transformedVerses[verseKey]) continue;
				
				// Sort words by position
				words.sort((a, b) => (a.position || 0) - (b.position || 0));
				
				// Extract and concatenate word data
				const arabicWords = [];
				const translationWords = [];
				const transliterationWords = [];
				
				for (const word of words) {
					const arabicText = word.text || word.arabic || word.code_v1 || '';
					arabicWords.push(arabicText);
					
					const translationText = word.translation?.text || word.translation || word.english || '';
					translationWords.push(translationText);
					
					const transliterationText = word.transliteration?.text || word.transliteration || word.phonetic || '';
					transliterationWords.push(transliterationText);
				}
				
				if (arabicWords.length > 0 && arabicWords.some(w => w.trim() !== '')) {
					transformedVerses[verseKey] = {
						words: {
							arabic: arabicWords.join(splitDelimiter),
							translation: translationWords.join(splitDelimiter),
							transliteration: transliterationWords.join(splitDelimiter)
						},
						meta: {
							page: pageData.page || 1,
							verseKey: verseKey,
							wordCount: words.length
						}
					};
				}
			}
		}
	}
	
	console.log(`✅ Chapter ${chapterNumber} prepared for KV: ${Object.keys(transformedVerses).length} verses`);
	return {
		chapter: chapterNumber,
		verses: transformedVerses,
		metadata: {
			totalVerses: Object.keys(transformedVerses).length,
			processedAt: new Date().toISOString()
		}
	};
}

/**
 * Upload chapter data to KV storage via worker
 * @param {number} chapterNumber - Chapter number
 * @param {Object} chapterData - Prepared chapter data
 * @returns {boolean} Success status
 */
export async function uploadToKV(chapterNumber, chapterData) {
	try {
		console.log(`🔄 Uploading chapter ${chapterNumber} to KV storage...`);
		
		// Temporarily disable KV uploads - direct return false
		console.log('⚠️ KV upload temporarily disabled due to proxy issues');
		return false;
		
		// const kvURL = getApiUrl(`/kv/chapter/${chapterNumber}`);
		
		const response = await fetch(kvURL, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(chapterData)
		});
		
		if (!response.ok) {
			throw new Error(`KV upload failed: ${response.status} ${response.statusText}`);
		}
		
		console.log(`✅ Chapter ${chapterNumber} uploaded to KV successfully`);
		return true;
		
	} catch (error) {
		console.error(`❌ KV upload failed for chapter ${chapterNumber}:`, error);
		return false;
	}
}

/**
 * Hybrid KV data fetcher - tries KV first, then JSDelivr, then API
 * @param {Object} props - Fetch parameters
 * @returns {Object} Chapter data in app format
 */
export async function hybridKVFetcher(props) {
	try {
		// 1. Try KV storage first (fastest)
		console.log(`🚀 Attempting KV fetch for chapter ${props.chapter}...`);
		const kvData = await fetchFromKV(props.chapter);
		
		if (kvData && Object.keys(kvData).length > 0) {
			console.log(`✅ KV fetch successful for chapter ${props.chapter}`);
			return { 
				data: { verses: kvData }, 
				source: 'kv',
				chapterNumber: props.chapter,
				verseCount: Object.keys(kvData).length
			};
		}
		
		// 2. If KV fails, fall back to JSDelivr (one-time download to populate KV)
		console.log(`⚠️ KV data not found, checking JSDelivr for chapter ${props.chapter}...`);
		
		// Import JSDelivr functions only if needed
		const { loadJSDelivrData, transformJSDelivrChapter } = await import('./jsdelivrAdapter.js');
		
		const jsdelivrData = await loadJSDelivrData();
		if (jsdelivrData) {
			console.log(`✅ JSDelivr data loaded, transforming chapter ${props.chapter}...`);
			const transformedData = transformJSDelivrChapter(jsdelivrData, props.chapter);
			
			if (transformedData && Object.keys(transformedData).length > 0) {
				// Prepare and upload to KV for future use
				const chapterForKV = prepareChapterForKV(jsdelivrData, props.chapter);
				uploadToKV(props.chapter, chapterForKV); // Don't wait for this
				
				console.log(`✅ JSDelivr transformation successful for chapter ${props.chapter}, uploaded to KV`);
				return { 
					data: { verses: transformedData }, 
					source: 'jsdelivr-to-kv',
					chapterNumber: props.chapter,
					verseCount: Object.keys(transformedData).length
				};
			}
		}
		
		// 3. Final fallback - return null to trigger API fallback
		console.log(`⚠️ Both KV and JSDelivr failed for chapter ${props.chapter}, will use API fallback`);
		return null;
		
	} catch (error) {
		console.error('❌ Hybrid KV fetch error:', error);
		return null;
	}
}

/**
 * Populate all chapters in KV storage (one-time setup)
 * @returns {Object} Results summary
 */
export async function populateAllChaptersInKV() {
	console.log('🚀 Starting full KV population process...');
	
	try {
		// Load JSDelivr data once
		const { loadJSDelivrData } = await import('./jsdelivrAdapter.js');
		const jsdelivrData = await loadJSDelivrData();
		
		if (!jsdelivrData) {
			throw new Error('Failed to load JSDelivr data');
		}
		
		const results = {
			success: 0,
			failed: 0,
			chapters: {}
		};
		
		// Process chapters 1-114
		for (let chapter = 1; chapter <= 114; chapter++) {
			try {
				console.log(`📖 Processing chapter ${chapter}...`);
				
				const chapterData = prepareChapterForKV(jsdelivrData, chapter);
				const uploaded = await uploadToKV(chapter, chapterData);
				
				if (uploaded) {
					results.success++;
					results.chapters[chapter] = 'success';
					console.log(`✅ Chapter ${chapter} uploaded successfully`);
				} else {
					results.failed++;
					results.chapters[chapter] = 'failed';
					console.log(`❌ Chapter ${chapter} upload failed`);
				}
				
				// Small delay to avoid overwhelming the worker
				await new Promise(resolve => setTimeout(resolve, 100));
				
			} catch (error) {
				results.failed++;
				results.chapters[chapter] = `error: ${error.message}`;
				console.error(`❌ Chapter ${chapter} processing error:`, error);
			}
		}
		
		console.log(`🎉 KV population complete: ${results.success} success, ${results.failed} failed`);
		return results;
		
	} catch (error) {
		console.error('❌ KV population failed:', error);
		throw error;
	}
}
