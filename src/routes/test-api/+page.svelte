<script>
	import { onMount } from 'svelte';
	import { fetchChapterData } from '$utils/fetchData';
	import { apiEndpoint, getApiUrl } from '$data/websiteSettings';

	let testResults = [];
	let testing = false;

	async function testAPI() {
		testing = true;
		testResults = [];
		
		// Test 1: Direct API call
		await testDirectAPI();
		
		// Test 2: Chapter data fetch
		await testChapterFetch();
		
		testing = false;
	}

	async function testDirectAPI() {
		try {
			const testUrl = `${apiEndpoint}/chapter?chapter=1&word_type=1&word_translation=1&word_transliteration=1&version=141`;
			
			testResults.push({
				test: 'Direct API Test',
				status: 'testing',
				url: testUrl,
				message: 'Testing direct API call...'
			});
			testResults = [...testResults];

			const response = await fetch(testUrl);
			
			if (response.ok) {
				const data = await response.json();
				testResults[testResults.length - 1] = {
					test: 'Direct API Test',
					status: 'success',
					url: testUrl,
					message: `✅ Success! Got ${Object.keys(data.data?.verses || {}).length} verses`,
					details: `Response status: ${response.status}`
				};
			} else {
				testResults[testResults.length - 1] = {
					test: 'Direct API Test',
					status: 'error',
					url: testUrl,
					message: `❌ Failed with status ${response.status}`,
					details: response.statusText
				};
			}
		} catch (error) {
			testResults[testResults.length - 1] = {
				test: 'Direct API Test',
				status: 'error',
				url: 'N/A',
				message: `❌ Network Error: ${error.message}`,
				details: error.toString()
			};
		}
		testResults = [...testResults];
	}

	async function testChapterFetch() {
		try {
			testResults.push({
				test: 'Chapter Fetch Test',
				status: 'testing',
				message: 'Testing fetchChapterData function...'
			});
			testResults = [...testResults];

			const chapterData = await fetchChapterData({ chapter: 1 });
			
			testResults[testResults.length - 1] = {
				test: 'Chapter Fetch Test',
				status: 'success',
				message: `✅ Success! Got ${Object.keys(chapterData || {}).length} verses`,
				details: 'fetchChapterData function working correctly'
			};
		} catch (error) {
			testResults[testResults.length - 1] = {
				test: 'Chapter Fetch Test',
				status: 'error',
				message: `❌ Error: ${error.message}`,
				details: error.toString()
			};
		}
		testResults = [...testResults];
	}

	onMount(() => {
		testAPI();
	});
</script>

<div class="container mx-auto p-6">
	<h1 class="text-2xl font-bold mb-6">🧪 API Test Page</h1>
	
	<div class="mb-4">
		<button 
			on:click={testAPI}
			disabled={testing}
			class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
		>
			{testing ? '🔄 Testing...' : '🧪 Run API Tests'}
		</button>
	</div>

	<div class="space-y-4">
		{#each testResults as result}
			<div class="border rounded-lg p-4 {
				result.status === 'success' ? 'bg-green-50 border-green-200' :
				result.status === 'error' ? 'bg-red-50 border-red-200' :
				'bg-yellow-50 border-yellow-200'
			}">
				<h3 class="font-semibold text-lg">{result.test}</h3>
				<p class="text-sm mt-1">{result.message}</p>
				{#if result.url}
					<p class="text-xs text-gray-600 mt-1">URL: {result.url}</p>
				{/if}
				{#if result.details}
					<p class="text-xs text-gray-500 mt-2">{result.details}</p>
				{/if}
			</div>
		{/each}
	</div>

	<div class="mt-8 text-center">
		<a href="/" class="text-blue-500 hover:text-blue-600 underline">
			← Back to Home
		</a>
	</div>
</div>

<style>
	.container {
		max-width: 800px;
	}
</style>
