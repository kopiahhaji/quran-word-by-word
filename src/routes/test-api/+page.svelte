<script>
	import { onMount } from 'svelte';
	import { staticEndpoint, apiEndpoint } from '$data/websiteSettings';
	
	let testResults = [];
	let isLoading = false;

	async function testAPI(url, description) {
		const startTime = Date.now();
		try {
			console.log(`Testing: ${description} - ${url}`);
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'User-Agent': 'Digital-Dakwah/4.0.0'
				},
				mode: 'cors'
			});
			
			const endTime = Date.now();
			const duration = endTime - startTime;
			
			if (response.ok) {
				const data = await response.json();
				return {
					url,
					description,
					status: 'SUCCESS',
					statusCode: response.status,
					duration: `${duration}ms`,
					dataSize: JSON.stringify(data).length,
					error: null
				};
			} else {
				return {
					url,
					description,
					status: 'HTTP_ERROR',
					statusCode: response.status,
					duration: `${duration}ms`,
					error: `${response.status} ${response.statusText}`
				};
			}
		} catch (error) {
			const endTime = Date.now();
			const duration = endTime - startTime;
			return {
				url,
				description,
				status: 'NETWORK_ERROR',
				duration: `${duration}ms`,
				error: error.message
			};
		}
	}

	async function runAllTests() {
		isLoading = true;
		testResults = [];
		
		const tests = [
			{ url: `${staticEndpoint}/meta/keysInPage.json?version=2`, description: 'Static Endpoint - Keys in Page' },
			{ url: `${apiEndpoint}/chapters/1`, description: 'API Endpoint - Chapter 1' },
			{ url: `${staticEndpoint}/meta/verseKeyData.json?version=2`, description: 'Static Endpoint - Verse Key Data' },
			{ url: 'https://audio.zikirnurani.com/words/1_1_1.mp3', description: 'R2 Audio Test' },
			{ url: 'https://httpbin.org/json', description: 'External API Test (httpbin)' }
		];

		for (const test of tests) {
			const result = await testAPI(test.url, test.description);
			testResults = [...testResults, result];
		}
		
		isLoading = false;
	}

	onMount(() => {
		// Auto-run tests when page loads
		runAllTests();
	});
</script>

<div class="p-6 max-w-4xl mx-auto">
	<h1 class="text-2xl font-bold mb-6">API Connectivity Test</h1>
	
	<div class="mb-4">
		<button 
			on:click={runAllTests} 
			disabled={isLoading}
			class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
		>
			{isLoading ? 'Testing...' : 'Run Tests'}
		</button>
	</div>

	<div class="space-y-4">
		{#each testResults as result}
			<div class="border rounded-lg p-4 {result.status === 'SUCCESS' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}">
				<div class="flex items-center justify-between mb-2">
					<h3 class="font-semibold">{result.description}</h3>
					<span class="px-2 py-1 rounded text-sm {result.status === 'SUCCESS' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}">
						{result.status}
					</span>
				</div>
				
				<div class="text-sm text-gray-600 space-y-1">
					<div><strong>URL:</strong> {result.url}</div>
					<div><strong>Duration:</strong> {result.duration}</div>
					{#if result.statusCode}
						<div><strong>Status Code:</strong> {result.statusCode}</div>
					{/if}
					{#if result.dataSize}
						<div><strong>Data Size:</strong> {result.dataSize} bytes</div>
					{/if}
					{#if result.error}
						<div class="text-red-600"><strong>Error:</strong> {result.error}</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-8 p-4 bg-gray-100 rounded">
		<h2 class="font-semibold mb-2">Environment Info</h2>
		<div class="text-sm space-y-1">
			<div><strong>Hostname:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'Unknown'}</div>
			<div><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}</div>
			<div><strong>Static Endpoint:</strong> {staticEndpoint}</div>
			<div><strong>API Endpoint:</strong> {apiEndpoint}</div>
		</div>
	</div>
</div>
