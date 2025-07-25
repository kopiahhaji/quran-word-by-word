<script>
	export let verseKey; // e.g., "1:1"
	export let chapterData; // From KV storage with multilingual support
	
	import { fetchFromKV, getTranslationFromKV, getWordsFromKV } from '$utils/kvAdapter';
	import { __userSettings } from '$utils/stores';
	import { onMount } from 'svelte';
	
	let multilingualData = null;
	let loading = true;
	let selectedLanguages = ['english', 'malay', 'chinese']; // Default languages
	
	// Language configuration with native names and flags
	const languages = {
		english: { name: 'English', native: 'English', flag: '🇺🇸', code: 'en' },
		malay: { name: 'Malay', native: 'Bahasa Melayu', flag: '🇲🇾', code: 'ms' },
		brunei: { name: 'Brunei Malay', native: 'Bahasa Brunei', flag: '🇧🇳', code: 'ms-BN' },
		tagalog: { name: 'Tagalog', native: 'Filipino', flag: '🇵🇭', code: 'tl' },
		chinese: { name: 'Chinese', native: '中文', flag: '🇨🇳', code: 'zh' }
	};
	
	// Load multilingual data for this verse
	onMount(async () => {
		try {
			const [chapter, verse] = verseKey.split(':');
			const kvData = await fetchFromKV(parseInt(chapter));
			
			if (kvData && kvData[verseKey]) {
				multilingualData = kvData[verseKey];
				console.log('📚 Multilingual data loaded:', multilingualData);
			}
		} catch (error) {
			console.error('❌ Failed to load multilingual data:', error);
		} finally {
			loading = false;
		}
	});
	
	// Get words for display
	$: words = multilingualData ? getWordsFromKV(multilingualData) : null;
	
	// Language selection handler
	function toggleLanguage(langCode) {
		if (selectedLanguages.includes(langCode)) {
			selectedLanguages = selectedLanguages.filter(l => l !== langCode);
		} else {
			selectedLanguages = [...selectedLanguages, langCode];
		}
	}
</script>

{#if loading}
	<div class="flex items-center space-x-2 text-sm opacity-70">
		<div class="animate-spin rounded-full h-4 w-4 border-b-2 {window.theme('border')}"></div>
		<span>Loading multilingual translations...</span>
	</div>
{:else if multilingualData}
	<div class="space-y-4">
		<!-- Language Selection -->
		<div class="flex flex-wrap gap-2 p-3 rounded-lg {window.theme('bgSecondaryLight')}">
			<span class="text-xs font-medium opacity-70">🌍 Languages:</span>
			{#each Object.entries(languages) as [code, lang]}
				<button
					on:click={() => toggleLanguage(code)}
					class="inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-full transition-colors
						{selectedLanguages.includes(code) 
							? `${window.theme('bgPrimary')} text-white` 
							: `${window.theme('bgSecondary')} ${window.theme('hover')}`}"
				>
					<span>{lang.flag}</span>
					<span>{lang.native}</span>
				</button>
			{/each}
		</div>
		
		<!-- Word-by-word Display -->
		{#if words}
			<div class="space-y-2">
				<h4 class="text-sm font-medium">🔤 Word-by-word:</h4>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 rounded-lg {window.theme('bgSecondaryLight')}">
					<div>
						<div class="text-xs font-medium mb-2">Arabic (العربية)</div>
						<div class="text-lg font-arabic direction-rtl">{words.arabic.join(' ')}</div>
					</div>
					<div>
						<div class="text-xs font-medium mb-2">English Translation</div>
						<div class="text-sm">{words.english.join(' • ')}</div>
					</div>
					<div>
						<div class="text-xs font-medium mb-2">Transliteration</div>
						<div class="text-sm italic">{words.transliteration.join(' • ')}</div>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Verse Translations -->
		<div class="space-y-3">
			<h4 class="text-sm font-medium">📖 Complete Verse Translations:</h4>
			{#each selectedLanguages as langCode}
				{@const translation = getTranslationFromKV(multilingualData, langCode)}
				{@const lang = languages[langCode]}
				{#if translation}
					<div class="p-3 rounded-lg border {window.theme('border')} {window.theme('bgMain')}">
						<div class="flex items-center space-x-2 mb-2">
							<span class="text-lg">{lang.flag}</span>
							<span class="text-sm font-medium">{lang.native}</span>
							<span class="text-xs opacity-50">({lang.name})</span>
						</div>
						<div class="text-sm leading-relaxed {langCode === 'chinese' ? 'font-chinese' : ''} 
							{langCode === 'arabic' ? 'direction-rtl' : ''}">
							{translation}
						</div>
					</div>
				{/if}
			{/each}
		</div>
		
		<!-- Metadata -->
		{#if multilingualData.meta}
			<div class="text-xs opacity-50 p-2 rounded {window.theme('bgSecondaryLight')}">
				📊 Page {multilingualData.meta.page} • {multilingualData.meta.wordCount} words • Verse {verseKey}
			</div>
		{/if}
	</div>
{:else}
	<div class="text-sm opacity-70">
		⚠️ Multilingual data not available for this verse.
	</div>
{/if}

<style>
	.font-arabic {
		font-family: 'Uthmanic_NeoCOLOR-Regular', 'Al Qalam Quran Majeed Web', 'Times New Roman', serif;
	}
	
	.font-chinese {
		font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
	}
	
	.direction-rtl {
		direction: rtl;
		text-align: right;
	}
</style>
