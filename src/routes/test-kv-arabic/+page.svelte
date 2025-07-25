<script>
	import { onMount } from 'svelte';
	import { fetchArabicFromKV } from '$utils/kvArabicOptimizer';
	import EnhancedArabicText from '$display/verses/EnhancedArabicText.svelte';
	import { __chapterNumber } from '$utils/stores';

	export let data;

	let testResults = [];
	let loading = false;
	let testChapter = 1; // Al-Fatiha
	let kvVerses = {};

	__chapterNumber.set(testChapter);

	async function testKVArabicFetch() {
		loading = true;
		testResults = [];

		try {
			console.log(`🔄 Testing KV Arabic text fetch for chapter ${testChapter}...`);
			
			const startTime = performance.now();
			const kvData = await fetchArabicFromKV(testChapter);
			const endTime = performance.now();
			
			if (kvData && Object.keys(kvData).length > 0) {
				kvVerses = kvData;
				
				testResults.push({
					type: 'success',
					message: `✅ KV Arabic fetch successful`,
					details: `Chapter ${testChapter}: ${Object.keys(kvData).length} verses loaded in ${(endTime - startTime).toFixed(2)}ms`
				});

				// Test each verse
				for (const [verseKey, verseData] of Object.entries(kvData)) {
					const arabicWords = verseData.words.arabic.split('|');
					testResults.push({
						type: 'verse',
						message: `📖 Verse ${verseKey}`,
						details: `${arabicWords.length} Arabic words found`,
						verseKey,
						verseData
					});
				}
			} else {
				testResults.push({
					type: 'error',
					message: `❌ No KV data found for chapter ${testChapter}`,
					details: 'Check if KV storage is populated'
				});
			}
		} catch (error) {
			testResults.push({
				type: 'error',
				message: `❌ KV fetch failed`,
				details: error.message
			});
		}
		
		loading = false;
	}

	onMount(() => {
		testKVArabicFetch();
	});
</script>

<svelte:head>
	<title>KV Arabic Text Test - Quran Word by Word</title>
	<meta name="description" content="Testing enhanced Arabic text retrieval from Cloudflare KV storage" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">🚀 KV Arabic Text Test</h1>
			<p class="text-gray-600">Testing enhanced Arabic text retrieval from Cloudflare KV storage</p>
		</div>

		<!-- Test Controls -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<div class="flex items-center space-x-4 mb-4">
				<label for="testChapter" class="font-medium">Test Chapter:</label>
				<select 
					id="testChapter" 
					bind:value={testChapter} 
					class="border border-gray-300 rounded px-3 py-1"
				>
					<option value={1}>1 - Al-Fatiha (7 verses)</option>
					<option value={2}>2 - Al-Baqarah (286 verses)</option>
					<option value={112}>112 - Al-Ikhlas (4 verses)</option>
					<option value={114}>114 - An-Nas (6 verses)</option>
				</select>
				
				<button 
					on:click={testKVArabicFetch}
					disabled={loading}
					class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
				>
					{loading ? '🔄 Testing...' : '🧪 Test KV Fetch'}
				</button>
			</div>
		</div>

		<!-- Test Results -->
		{#if testResults.length > 0}
			<div class="bg-white rounded-lg shadow-md p-6 mb-6">
				<h2 class="text-xl font-semibold mb-4">📊 Test Results</h2>
				
				<div class="space-y-3">
					{#each testResults as result}
						<div class="result-item p-3 rounded border-l-4 {
							result.type === 'success' ? 'bg-green-50 border-green-400' :
							result.type === 'error' ? 'bg-red-50 border-red-400' :
							'bg-blue-50 border-blue-400'
						}">
							<div class="font-medium">{result.message}</div>
							<div class="text-sm text-gray-600">{result.details}</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Arabic Text Display -->
		{#if Object.keys(kvVerses).length > 0}
			<div class="bg-white rounded-lg shadow-md p-6">
				<h2 class="text-xl font-semibold mb-4">📖 Enhanced Arabic Text Display (From KV)</h2>
				
				<div class="space-y-6">
					{#each Object.entries(kvVerses) as [verseKey, verseData]}
						<div class="verse-container border-b border-gray-200 pb-6 last:border-b-0">
							<div class="flex items-center space-x-2 mb-3">
								<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
									{verseKey}
								</span>
								<span class="text-gray-500 text-sm">
									{verseData.words.arabic.split('|').length} words from KV
								</span>
							</div>
							
							<EnhancedArabicText 
								{verseKey} 
								{verseData} 
								showValidation={true} 
							/>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Back to App -->
		<div class="text-center mt-8">
			<a 
				href="/" 
				class="inline-flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded transition-colors"
			>
				<span>←</span>
				<span>Back to Quran App</span>
			</a>
		</div>
	</div>
</div>

<style>
	.result-item {
		transition: all 0.2s ease;
	}
	
	.verse-container {
		transition: all 0.2s ease;
	}
	
	.verse-container:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0,0,0,0.05);
	}
</style>
