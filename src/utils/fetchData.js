import { db } from '$utils/db';
import { get } from 'svelte/store';
import { __fontType, __chapterData, __verseTranslationData, __wordTranslation, __wordTransliteration, __verseTranslations, __timestampData } from '$utils/stores';
import { apiEndpoint, staticEndpoint, apiVersion, getApiUrl, corsProxyConfig } from '$data/websiteSettings';
import { selectableFontTypes } from '$data/options';
// Removed KV and JSDelivr adapters to ensure stable API-only operation

// Fetch specific verses (startVerse to endVerse) and cache the data
export async function fetchChapterData(props) {
	if (!props.skipSave) __chapterData.set(null);

	const fontType = props.fontType || get(__fontType);
	const wordTranslation = props.wordTranslation || get(__wordTranslation);
	const wordTransliteration = props.wordTransliteration || get(__wordTransliteration);

	// Validate fontType to prevent undefined errors
	if (!fontType || !selectableFontTypes[fontType]) {
		console.error('❌ Invalid fontType:', fontType, 'Available types:', Object.keys(selectableFontTypes));
		throw new Error(`Invalid fontType: ${fontType}. Available types: ${Object.keys(selectableFontTypes).join(', ')}`);
	}

	// Generate a unique key for the data
	const cacheKey = `${props.chapter}_${selectableFontTypes[fontType].apiId}_${wordTranslation}_${wordTransliteration}_${apiVersion}`;

	// Try to load from cache
	const cachedData = await useCache(cacheKey, 'chapter');
	if (cachedData) {
		if (!props.skipSave) __chapterData.set(cachedData);
		return cachedData;
	}

	// 🔄 Use original API method (KV temporarily disabled)
	console.log('🔄 Using API for chapter', props.chapter);
	
	// Build API URL
	const apiURL =
		`${apiEndpoint}/chapter?` +
		new URLSearchParams({
			chapter: props.chapter,
			word_type: selectableFontTypes[fontType].apiId,
			word_translation: wordTranslation,
			word_transliteration: wordTransliteration,
			version: apiVersion
		});

	// Fetch from API with simplified proxy logic
	let response;
	
	try {
		// For production: Use reliable proxy directly
		if (corsProxyConfig.useProxy) {
			const proxiedUrl = getApiUrl(apiURL);
			console.log('🔄 Using proxy for production environment:', proxiedUrl);
			response = await fetch(proxiedUrl);
		} else {
			// For development: Direct API call
			console.log('🔄 Direct API call for development');
			response = await fetch(apiURL);
		}
		
		if (!response.ok) {
			throw new Error(`API request failed with status: ${response.status}`);
		}
		
		console.log('✅ API call successful');
		
	} catch (error) {
		console.error('❌ API fetch failed:', error.message);
		throw new Error(
			JSON.stringify({
				status: response?.status || 500,
				statusText: response?.statusText || 'Network Error',
				message: `API request failed for chapter ${props.chapter}: ${error.message}`
			})
		);
	}
	
	const data = await response.json();

	// Validate response data structure
	if (!data || !data.data || !data.data.verses) {
		console.error('❌ Invalid API response structure:', data);
		throw new Error('Invalid API response: missing verses data');
	}

	// Save to cache
	await useCache(cacheKey, 'chapter', data.data.verses);

	// Update store
	if (!props.skipSave) __chapterData.set(data.data.verses);

	return data.data.verses;
}

// Fetch specific translations and cache the data
export async function fetchVerseTranslationData(props) {
	// Use translation IDs from props or fallback to store
	if (!props.translations) props.translations = get(__verseTranslations);

	// Get current store data
	const existingData = get(__verseTranslationData) || {};

	// Final object to hold the complete data
	const updatedData = { ...existingData };

	// Filter translation IDs that need to be fetched (not in store or cache)
	const idsToFetch = [];

	for (const id of props.translations) {
		// Try to load from cache first
		const cacheKey = `translation_${id}_${apiVersion}`;
		const cached = await useCache(cacheKey, 'translation');

		if (cached && typeof cached === 'object' && Object.keys(cached).length > 0) {
			updatedData[id] = cached;
		} else {
			idsToFetch.push(id);
		}
	}

	// Early return if everything was found in cache/store
	if (idsToFetch.length === 0) {
		// Update the store
		if (!props.skipSave) __verseTranslationData.set(updatedData);

		return updatedData;
	}

	// Fetch missing translations
	const fetchPromises = idsToFetch.map(async (id) => {
		const url = `${staticEndpoint}/translations/data/translation_${id}.json?v=${apiVersion}`;
		try {
			const res = await fetch(getApiUrl(url));
			if (!res.ok) throw new Error(`Failed to fetch translation ID ${id}`);
			const data = await res.json();

			// Save to cache
			await useCache(`translation_${id}_${apiVersion}`, 'translation', data);

			return { id, data };
		} catch (error) {
			console.warn(`Error fetching translation ${id}:`, error);
			return { id, data: null };
		}
	});

	const results = await Promise.all(fetchPromises);

	// Merge fetched data into final object
	for (const { id, data } of results) {
		if (data) {
			updatedData[id] = data;
		}
	}

	// Update the store
	if (!props.skipSave) __verseTranslationData.set(updatedData);

	return updatedData;
}

// Generic fetch and cache utility
export async function fetchAndCacheJson(url, type = 'other') {
	// Generate a unique key for the data
	const parsedUrl = new URL(url);
	const pathParts = parsedUrl.pathname.split('/').filter(Boolean); // removes empty strings
	const lastPart = pathParts[pathParts.length - 1] || '';
	const secondLastPart = pathParts[pathParts.length - 2] || 'root'; // fallback if not present
	const cacheKey = `${secondLastPart}/${lastPart}${parsedUrl.search}`;

	// Try to load from cache
	const cachedData = await useCache(cacheKey, type);
	if (cachedData) {
		return cachedData;
	}

	// Fetch from API
	const response = await fetch(getApiUrl(url));
	if (!response.ok) {
		throw new Error('Failed to fetch data from the API');
	}
	const data = await response.json();

	// Save to cache
	await useCache(cacheKey, type, data);

	return data;
}

// Fetch timestamps for word-by-word highlighting
export async function fetchTimestampData(chapter) {
	const apiURL = `${staticEndpoint}/timestamps/${chapter}.json?version=1`;
	const response = await fetch(getApiUrl(apiURL));
	const data = await response.json();
	__timestampData.set(data);
}

// Unified cache utility for IndexedDB with version and freshness control
async function useCache(key, type, dataToSet = undefined) {
	try {
		// Select the appropriate table based on the type
		let table;

		switch (type) {
			case 'chapter':
				table = db.chapter_data;
				break;
			case 'translation':
				table = db.translation_data;
				break;
			case 'morphology':
				table = db.morphology_data;
				break;
			case 'tafsir':
				table = db.tafsir_data;
				break;
			case 'other':
				table = db.other_data;
				break;
			default:
				throw new Error(`Invalid table for type: ${type}`);
		}

		if (!table) throw new Error(`Table not found for type: ${type}`);

		// Access the version table to verify current API version
		const versionTable = db.data_version;
		const versionRecord = await versionTable.get('version');
		const storedVersion = versionRecord?.value;

		// If no version exists or it doesn't match the current version,
		// clear both caches and update the stored version
		if (storedVersion !== apiVersion) {
			await Promise.all([db.chapter_data.clear(), db.translation_data.clear(), versionTable.put({ key: 'version', value: apiVersion })]);
		}

		if (dataToSet !== undefined) {
			// Set data in the cache with current timestamp
			await table.put({
				key,
				data: dataToSet,
				timestamp: Date.now()
			});
			return true;
		} else {
			// Attempt to retrieve cached data
			const record = await table.get(key);
			if (!record) return null;

			// Check if the cached data is fresh (within 7 days)
			const isFresh = Date.now() - record.timestamp < 7 * 24 * 60 * 60 * 1000;
			if (isFresh) {
				return record.data;
			} else {
				// If stale, delete it and return null to trigger a fresh fetch
				await table.delete(key);
				return null;
			}
		}
	} catch (error) {
		// Log any unexpected errors and return appropriate fallback
		console.warn('IndexedDB cache error:', error?.message || error);
		return dataToSet !== undefined ? false : null;
	}
}
