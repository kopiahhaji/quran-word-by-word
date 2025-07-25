<script>
	/**
	 * Enhanced Arabic Text Display Component
	 * 
	 * Prioritizes and showcases Arabic text from KV storage with validation
	 */
	
	import { onMount } from 'svelte';
	import { fetchArabicFromKV, validateArabicFromKV, getArabicWordsFromKV } from '$utils/kvArabicOptimizer';
	import { splitDelimiter } from '$data/websiteSettings';
	import { __chapterNumber } from '$utils/stores';

	export let verseKey = '';
	export let verseData = null;
	export let showValidation = false;

	let arabicWords = [];
	let isValidArabic = false;
	let arabicText = '';
	let wordCount = 0;
	let kvSource = false;

	// Extract Arabic text when verse data changes
	$: if (verseData) {
		extractArabicText();
	}

	function extractArabicText() {
		if (!verseData) return;

		try {
			// Validate the Arabic text quality
			isValidArabic = validateArabicFromKV(verseData);
			
			if (isValidArabic) {
				// Extract Arabic words using our KV optimizer
				arabicWords = getArabicWordsFromKV(verseData);
				arabicText = arabicWords.join(' ');
				wordCount = arabicWords.length;
				kvSource = true;
				
				console.log(`✅ Arabic text loaded from KV for ${verseKey}: ${wordCount} words`);
			} else {
				console.warn(`⚠️ Invalid Arabic text for ${verseKey}`);
				arabicWords = [];
				arabicText = 'Arabic text validation failed';
				wordCount = 0;
			}
		} catch (error) {
			console.error(`❌ Error extracting Arabic text for ${verseKey}:`, error);
			arabicWords = [];
			arabicText = 'Error loading Arabic text';
			wordCount = 0;
		}
	}

	// Test function to fetch Arabic text directly from KV
	async function testKVArabicFetch() {
		try {
			console.log(`🔄 Testing direct KV Arabic fetch for chapter ${$__chapterNumber}...`);
			const kvData = await fetchArabicFromKV($__chapterNumber);
			
			if (kvData && Object.keys(kvData).length > 0) {
				console.log(`✅ KV Arabic test successful: ${Object.keys(kvData).length} verses loaded`);
				return kvData;
			}
		} catch (error) {
			console.error('❌ KV Arabic test failed:', error);
		}
	}

	onMount(() => {
		if (showValidation) {
			testKVArabicFetch();
		}
	});
</script>

<div class="arabic-text-container">
	{#if showValidation}
		<div class="validation-info mb-4 p-3 rounded-lg {isValidArabic ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
			<div class="flex items-center space-x-2">
				<span class="text-lg">{isValidArabic ? '✅' : '❌'}</span>
				<span class="font-medium">
					{isValidArabic ? 'Valid Arabic Text from KV' : 'Arabic Text Validation Failed'}
				</span>
				{#if kvSource}
					<span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">KV Source</span>
				{/if}
			</div>
			{#if isValidArabic}
				<div class="text-sm text-gray-600 mt-1">
					Verse: {verseKey} • Words: {wordCount} • Source: Cloudflare KV
				</div>
			{/if}
		</div>
	{/if}

	{#if isValidArabic && arabicText}
		<div class="arabic-text-display">
			<!-- Enhanced Arabic text with proper RTL direction -->
			<div class="arabic-main text-right" dir="rtl" lang="ar">
				{#each arabicWords as word, index}
					<span 
						class="arabic-word inline-block mx-1 hover:bg-yellow-100 hover:shadow-sm transition-all duration-200 cursor-pointer rounded px-1" 
						data-word-index={index}
						data-arabic={word}
						title="Word {index + 1}: {word}"
					>
						{word}
					</span>
				{/each}
			</div>
			
			{#if showValidation}
				<!-- Word breakdown for validation -->
				<div class="word-breakdown mt-4 p-3 bg-gray-50 rounded">
					<h4 class="font-medium text-gray-700 mb-2">🔤 Word-by-Word Breakdown (KV Source)</h4>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
						{#each arabicWords as word, index}
							<div class="word-item p-2 bg-white rounded border">
								<span class="word-number text-xs text-gray-500">#{index + 1}</span>
								<div class="arabic-word text-right" dir="rtl" lang="ar">{word}</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="error-display p-4 bg-red-50 border border-red-200 rounded-lg">
			<div class="flex items-center space-x-2">
				<span class="text-red-500">⚠️</span>
				<span class="text-red-700">Arabic text not available or validation failed</span>
			</div>
			<div class="text-sm text-red-600 mt-1">
				Please check KV storage or try refreshing the page
			</div>
		</div>
	{/if}
</div>

<style>
	.arabic-text-container {
		font-family: 'Uthmanic Hafs', 'Arabic Typesetting', 'Traditional Arabic', serif;
	}
	
	.arabic-main {
		font-size: 1.5rem;
		line-height: 2.5;
		font-weight: normal;
	}
	
	.arabic-word {
		transition: all 0.2s ease;
	}
	
	.arabic-word:hover {
		transform: scale(1.05);
	}
	
	.word-item .arabic-word {
		font-size: 1.2rem;
		font-weight: 500;
	}
	
	.word-number {
		display: block;
		text-align: left;
	}
</style>
