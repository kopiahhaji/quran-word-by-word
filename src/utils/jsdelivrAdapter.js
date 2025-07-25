/**
 * JSDelivr Data Adapter for Quran Word-by-Word App
 * 
 * Converts JSDelivr package format to the app's expected format:
 * JSDelivr: Array of word objects → App: Pipe-delimited strings
 */

import { splitDelimiter } from '$data/websiteSettings';

/**
 * Downloads and caches JSDelivr data
 */
export async function loadJSDelivrData() {
	try {
		const response = await fetch('https://cdn.jsdelivr.net/npm/@kmaslesa/holy-quran-word-by-word-full-data@1.0.6/data.json');
		if (!response.ok) {
			throw new Error(`JSDelivr fetch failed: ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		console.warn('JSDelivr data load failed:', error);
		return null;
	}
}

/**
 * Transforms JSDelivr chapter data to app format
 * @param {Array} jsdelivrData - Full JSDelivr dataset
 * @param {number} chapterNumber - Chapter number (1-114)
 * @returns {Object} Transformed data in app format
 */
export function transformJSDelivrChapter(jsdelivrData, chapterNumber) {
	if (!jsdelivrData || !chapterNumber) {
		throw new Error('Invalid parameters for JSDelivr transformation');
	}

	console.log(`🔄 Transforming JSDelivr data for chapter ${chapterNumber}...`);
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
				// Handle missing or malformed word data
				if (!word || !word.parentAyahVerseKey) {
					console.warn('⚠️ Skipping word with missing parentAyahVerseKey:', word);
					continue;
				}
				
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
				if (transformedVerses[verseKey]) continue; // Already processed
				
				// Sort words by position
				words.sort((a, b) => (a.position || 0) - (b.position || 0));
				
				// Extract and concatenate word data with better error handling
				const arabicWords = [];
				const translationWords = [];
				const transliterationWords = [];
				
				for (const word of words) {
					// Handle Arabic text - check multiple possible fields
					const arabicText = word.text || word.arabic || word.code_v1 || '';
					arabicWords.push(arabicText);
					
					// Handle translation
					const translationText = word.translation?.text || word.translation || word.english || '';
					translationWords.push(translationText);
					
					// Handle transliteration
					const transliterationText = word.transliteration?.text || word.transliteration || word.phonetic || '';
					transliterationWords.push(transliterationText);
				}
				
				// Only create verse if we have valid data
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
						},
						// Additional JSDelivr data that might be useful
						jsdelivr: {
							audioUrls: words.map(w => w.audio_url).filter(Boolean),
							wordPositions: words.map(w => w.position || 0),
							source: 'jsdelivr'
						}
					};
					
					console.log(`✅ Transformed verse ${verseKey}: ${arabicWords.length} words`);
				} else {
					console.warn(`⚠️ Skipping verse ${verseKey}: no valid Arabic text found`);
				}
			}
		}
	}
	
	console.log(`✅ Chapter ${chapterNumber} transformation complete: ${Object.keys(transformedVerses).length} verses`);
	return transformedVerses;
}

/**
 * Gets specific verse data from JSDelivr in app format
 * @param {Array} jsdelivrData - Full JSDelivr dataset  
 * @param {string} verseKey - Verse key like "1:1"
 * @returns {Object|null} Verse data in app format
 */
export function getJSDelivrVerse(jsdelivrData, verseKey) {
	if (!jsdelivrData || !verseKey) return null;
	
	const [chapterStr, verseStr] = verseKey.split(':');
	const chapter = parseInt(chapterStr);
	const verse = parseInt(verseStr);
	
	// Search through pages for this verse
	for (const pageData of jsdelivrData) {
		if (!pageData.ayahs) continue;
		
		for (const ayah of pageData.ayahs) {
			if (!ayah.words) continue;
			
			const verseWords = ayah.words.filter(word => {
				if (!word.parentAyahVerseKey) return false;
				const [wordChapter, wordVerse] = word.parentAyahVerseKey.split(':');
				return parseInt(wordChapter) === chapter && parseInt(wordVerse) === verse;
			});
			
			if (verseWords.length === 0) continue;
			
			// Sort by position and transform
			verseWords.sort((a, b) => a.position - b.position);
			
			const arabicWords = verseWords.map(w => w.text || '').filter(Boolean);
			const translationWords = verseWords.map(w => w.translation?.text || '').filter(Boolean);
			const transliterationWords = verseWords.map(w => w.transliteration?.text || '').filter(Boolean);
			
			return {
				words: {
					arabic: arabicWords.join(splitDelimiter),
					translation: translationWords.join(splitDelimiter),
					transliteration: transliterationWords.join(splitDelimiter)
				},
				meta: {
					page: pageData.page,
					verseKey: verseKey,
					wordCount: verseWords.length
				},
				jsdelivr: {
					audioUrls: verseWords.map(w => w.audio_url).filter(Boolean),
					wordPositions: verseWords.map(w => w.position)
				}
			};
		}
	}
	
	return null;
}

/**
 * Creates a hybrid data fetcher that tries JSDelivr first, then falls back to current API
 * @param {Object} props - Fetch parameters
 * @returns {Object} Chapter data in app format
 */
export async function hybridDataFetcher(props) {
	try {
		// Try JSDelivr first
		console.log(`🔄 Attempting JSDelivr data fetch for chapter ${props.chapter}...`);
		const jsdelivrData = await loadJSDelivrData();
		
		if (jsdelivrData && Array.isArray(jsdelivrData) && jsdelivrData.length > 0) {
			console.log(`✅ JSDelivr data loaded (${jsdelivrData.length} pages), transforming...`);
			const transformedData = transformJSDelivrChapter(jsdelivrData, props.chapter);
			
			if (transformedData && Object.keys(transformedData).length > 0) {
				console.log(`✅ JSDelivr transformation successful: ${Object.keys(transformedData).length} verses for chapter ${props.chapter}`);
				return { 
					data: { verses: transformedData }, 
					source: 'jsdelivr',
					chapterNumber: props.chapter,
					verseCount: Object.keys(transformedData).length
				};
			} else {
				console.warn(`⚠️ JSDelivr transformation returned no verses for chapter ${props.chapter}`);
			}
		} else {
			console.warn('⚠️ JSDelivr data is invalid or empty');
		}
		
		console.log('⚠️ JSDelivr failed, falling back to current API...');
		return null; // Let the calling code handle the fallback
		
	} catch (error) {
		console.error('❌ Hybrid fetch error:', error);
		console.log('🔄 Falling back to current API due to error...');
		return null; // Let the calling code handle the fallback
	}
}

/**
 * Test function to validate the transformation
 * @param {number} chapter - Chapter to test (default: 1)
 * @param {number} verse - Verse to test (default: 1)  
 */
export async function testJSDelivrTransformation(chapter = 1, verse = 1) {
	console.log(`🧪 Testing JSDelivr transformation for ${chapter}:${verse}...`);
	
	try {
		const data = await loadJSDelivrData();
		if (!data) {
			console.error('❌ Failed to load JSDelivr data');
			return false;
		}
		
		const verseData = getJSDelivrVerse(data, `${chapter}:${verse}`);
		if (!verseData) {
			console.error(`❌ No data found for verse ${chapter}:${verse}`);
			return false;
		}
		
		console.log('✅ Transformation successful!');
		console.log('📊 Transformed verse data:', verseData);
		
		// Validate format
		const hasWords = verseData.words && 
						 verseData.words.arabic && 
						 verseData.words.translation && 
						 verseData.words.transliteration;
		
		if (hasWords) {
			console.log('✅ Format validation passed');
			console.log(`📝 Arabic: ${verseData.words.arabic}`);
			console.log(`🔤 Transliteration: ${verseData.words.transliteration}`);
			console.log(`🌍 Translation: ${verseData.words.translation}`);
			return true;
		} else {
			console.error('❌ Format validation failed');
			return false;
		}
		
	} catch (error) {
		console.error('❌ Test failed:', error);
		return false;
	}
}
