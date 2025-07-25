/**
 * KV Arabic Text Optimizer
 * 
 * Enhanced functions to prioritize and optimize Arabic text usage from KV storage
 */

import { fetchFromKV, getWordsFromKV } from '$utils/kvAdapter';
import { splitDelimiter } from '$data/websiteSettings';

/**
 * Force Arabic text fetch from KV storage only
 * @param {number} chapterNumber - Chapter number (1-114)
 * @returns {Object} Chapter data with Arabic text from KV
 */
export async function fetchArabicFromKV(chapterNumber) {
	try {
		console.log(`🔄 Fetching Arabic text from KV for chapter ${chapterNumber}...`);
		
		const kvData = await fetchFromKV(chapterNumber);
		
		if (!kvData || Object.keys(kvData).length === 0) {
			throw new Error('No KV data available for Arabic text');
		}

		// Transform KV data to ensure Arabic text priority
		const optimizedVerses = {};
		
		for (const [verseKey, verseData] of Object.entries(kvData)) {
			if (!verseData.words?.arabic) {
				console.warn(`⚠️ No Arabic text in KV for verse ${verseKey}`);
				continue;
			}

			// Extract Arabic words and ensure they're properly formatted
			const arabicWords = verseData.words.arabic.split(splitDelimiter);
			const englishWords = verseData.words.english ? verseData.words.english.split(splitDelimiter) : [];
			const transliterationWords = verseData.words.transliteration ? verseData.words.transliteration.split(splitDelimiter) : [];

			// Ensure all arrays have the same length, padding with empty strings if needed
			const maxLength = Math.max(arabicWords.length, englishWords.length, transliterationWords.length);
			
			while (arabicWords.length < maxLength) arabicWords.push('');
			while (englishWords.length < maxLength) englishWords.push('');
			while (transliterationWords.length < maxLength) transliterationWords.push('');

			optimizedVerses[verseKey] = {
				...verseData,
				words: {
					arabic: arabicWords.join(splitDelimiter),
					translation: englishWords.join(splitDelimiter), // Note: using 'translation' not 'english'
					transliteration: transliterationWords.join(splitDelimiter)
				},
				// Ensure metadata is present
				meta: verseData.meta || {
					chapter: parseInt(verseKey.split(':')[0]),
					verse: parseInt(verseKey.split(':')[1]),
					words: arabicWords.length,
					page: verseData.page || 1,
					juz: verseData.juz || 1
				}
			};
		}

		console.log(`✅ Arabic text optimized from KV for chapter ${chapterNumber}: ${Object.keys(optimizedVerses).length} verses`);
		return optimizedVerses;

	} catch (error) {
		console.error(`❌ Failed to fetch Arabic text from KV for chapter ${chapterNumber}:`, error);
		throw error;
	}
}

/**
 * Get Arabic words array from KV verse data
 * @param {Object} verseData - Verse data from KV
 * @returns {Array} Array of Arabic words
 */
export function getArabicWordsFromKV(verseData) {
	if (!verseData?.words?.arabic) {
		console.warn('⚠️ No Arabic words found in verse data');
		return [];
	}
	
	return verseData.words.arabic.split(splitDelimiter).filter(word => word.trim() !== '');
}

/**
 * Validate Arabic text quality from KV
 * @param {Object} verseData - Verse data from KV  
 * @returns {boolean} True if Arabic text is valid and complete
 */
export function validateArabicFromKV(verseData) {
	if (!verseData?.words?.arabic) return false;
	
	const arabicWords = verseData.words.arabic.split(splitDelimiter);
	
	// Check if we have actual Arabic text (not just empty strings)
	const hasValidArabic = arabicWords.some(word => {
		const trimmed = word.trim();
		// Check for Arabic characters (basic range)
		return trimmed.length > 0 && /[\u0600-\u06FF]/.test(trimmed);
	});
	
	if (!hasValidArabic) {
		console.warn('⚠️ Invalid or missing Arabic text in verse data');
		return false;
	}
	
	return true;
}

/**
 * Enhanced KV fetcher that prioritizes Arabic text quality
 * @param {Object} props - Chapter fetch properties
 * @returns {Object} Enhanced verse data with validated Arabic text
 */
export async function enhancedKVFetcher(props) {
	try {
		const kvData = await fetchArabicFromKV(props.chapter);
		
		// Validate each verse has proper Arabic text
		const validatedVerses = {};
		let validCount = 0;
		
		for (const [verseKey, verseData] of Object.entries(kvData)) {
			if (validateArabicFromKV(verseData)) {
				validatedVerses[verseKey] = verseData;
				validCount++;
			} else {
				console.warn(`⚠️ Skipping verse ${verseKey} - invalid Arabic text`);
			}
		}
		
		if (validCount === 0) {
			throw new Error(`No valid Arabic text found in KV for chapter ${props.chapter}`);
		}
		
		console.log(`✅ Enhanced KV fetch completed: ${validCount}/${Object.keys(kvData).length} verses with valid Arabic text`);
		
		return {
			data: { verses: validatedVerses },
			source: 'kv-enhanced',
			chapterNumber: props.chapter,
			verseCount: validCount,
			validationPassed: true
		};
		
	} catch (error) {
		console.error(`❌ Enhanced KV fetch failed for chapter ${props.chapter}:`, error);
		throw error;
	}
}
