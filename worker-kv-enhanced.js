/**
 * Enhanced Cloudflare Worker with KV Storage for Quran Data
 * 
 * Handles both CORS proxy and KV-based Quran data storage/retrieval
 * Much faster than downloading large JSON files repeatedly
 */

// KV namespace binding (configured in wrangler.toml)
// KV_QURAN_DATA should be bound to your KV namespace

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const path = url.pathname;

		// Enable CORS for all responses
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Max-Age': '86400',
		};

		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// KV Routes for Quran data
			if (path.startsWith('/kv/chapter/')) {
				return await handleKVChapterRequest(request, env, corsHeaders);
			}

			if (path === '/kv/populate') {
				return await handleKVPopulateRequest(request, env, corsHeaders);
			}

			if (path === '/kv/status') {
				return await handleKVStatusRequest(request, env, corsHeaders);
			}

			if (path.startsWith('/kv/raw/')) {
				return await handleKVRawRequest(request, env, corsHeaders);
			}

			if (path === '/debug') {
				return await handleDebugRequest(request, env, corsHeaders);
			}

			// Original CORS proxy functionality
			if (path.startsWith('/proxy/')) {
				return await handleProxyRequest(request, env, corsHeaders);
			}

			// Health check
			if (path === '/health') {
				return new Response(JSON.stringify({
					status: 'healthy',
					timestamp: new Date().toISOString(),
					features: ['cors-proxy', 'kv-storage'],
					worker: 'quran-api-enhanced-kv'
				}), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}

			// Default response
			return new Response(JSON.stringify({
				error: 'Not Found',
				availableRoutes: [
					'/kv/chapter/{number}',
					'/kv/populate',
					'/kv/status',
					'/proxy/{url}',
					'/health'
				]
			}), {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});

		} catch (error) {
			console.error('Worker error:', error);
			return new Response(JSON.stringify({
				error: 'Internal Server Error',
				message: error.message,
				timestamp: new Date().toISOString()
			}), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}
	}
};

/**
 * Handle KV chapter requests (GET/PUT)
 */
async function handleKVChapterRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const pathParts = url.pathname.split('/');
	const chapterNumber = parseInt(pathParts[3]);

	if (!chapterNumber || chapterNumber < 1 || chapterNumber > 114) {
		return new Response(JSON.stringify({
			error: 'Invalid chapter number',
			message: 'Chapter number must be between 1 and 114'
		}), {
			status: 400,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}

	const kvKey = `chapter:${chapterNumber}`;

	try {
		if (request.method === 'GET') {
			// Retrieve chapter from KV
			console.log(`Retrieving chapter ${chapterNumber} from KV with key: ${kvKey}`);
			console.log(`KV namespace available:`, !!env.KV_QURAN_DATA);
			console.log(`Environment keys:`, Object.keys(env));
			
			const cachedData = await env.KV_QURAN_DATA.get(kvKey, 'json');
			
			if (cachedData) {
				console.log(`✅ Chapter ${chapterNumber} found in KV`);
				return new Response(JSON.stringify({
					...cachedData,
					source: 'kv',
					retrievedAt: new Date().toISOString()
				}), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			} else {
				console.log(`❌ Chapter ${chapterNumber} not found in KV`);
				return new Response(JSON.stringify({
					error: 'Chapter not found',
					chapter: chapterNumber,
					message: 'Chapter data not available in KV storage'
				}), {
					status: 404,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}

		} else if (request.method === 'PUT') {
			// Store chapter in KV
			console.log(`Storing chapter ${chapterNumber} in KV...`);
			
			const chapterData = await request.json();
			
			if (!chapterData || !chapterData.verses) {
				return new Response(JSON.stringify({
					error: 'Invalid chapter data',
					message: 'Chapter data must include verses object'
				}), {
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}

			// Add metadata
			const dataToStore = {
				...chapterData,
				storedAt: new Date().toISOString(),
				chapter: chapterNumber
			};

			await env.KV_QURAN_DATA.put(kvKey, JSON.stringify(dataToStore));
			
			console.log(`✅ Chapter ${chapterNumber} stored in KV successfully`);
			
			return new Response(JSON.stringify({
				success: true,
				chapter: chapterNumber,
				verseCount: Object.keys(chapterData.verses).length,
				message: 'Chapter stored successfully',
				storedAt: dataToStore.storedAt
			}), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});

		} else {
			return new Response(JSON.stringify({
				error: 'Method not allowed',
				allowed: ['GET', 'PUT']
			}), {
				status: 405,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

	} catch (error) {
		console.error(`KV operation error for chapter ${chapterNumber}:`, error);
		return new Response(JSON.stringify({
			error: 'KV operation failed',
			chapter: chapterNumber,
			message: error.message
		}), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
}

/**
 * Handle KV population request (for bulk upload)
 */
async function handleKVPopulateRequest(request, env, corsHeaders) {
	if (request.method !== 'POST') {
		return new Response(JSON.stringify({
			error: 'Method not allowed',
			allowed: ['POST']
		}), {
			status: 405,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}

	try {
		const { chapters } = await request.json();
		
		if (!chapters || typeof chapters !== 'object') {
			return new Response(JSON.stringify({
				error: 'Invalid request',
				message: 'Request must include chapters object'
			}), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const results = {
			success: 0,
			failed: 0,
			chapters: {}
		};

		// Process each chapter
		for (const [chapterNum, chapterData] of Object.entries(chapters)) {
			try {
				const chapterNumber = parseInt(chapterNum);
				if (chapterNumber < 1 || chapterNumber > 114) {
					results.failed++;
					results.chapters[chapterNum] = 'Invalid chapter number';
					continue;
				}

				const kvKey = `chapter:${chapterNumber}`;
				const dataToStore = {
					...chapterData,
					storedAt: new Date().toISOString(),
					chapter: chapterNumber
				};

				await env.KV_QURAN_DATA.put(kvKey, JSON.stringify(dataToStore));
				
				results.success++;
				results.chapters[chapterNum] = 'success';

			} catch (error) {
				results.failed++;
				results.chapters[chapterNum] = `Error: ${error.message}`;
			}
		}

		return new Response(JSON.stringify({
			message: 'Bulk population completed',
			results,
			timestamp: new Date().toISOString()
		}), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});

	} catch (error) {
		console.error('KV populate error:', error);
		return new Response(JSON.stringify({
			error: 'Population failed',
			message: error.message
		}), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
}

/**
 * Handle KV status request
 */
async function handleKVStatusRequest(request, env, corsHeaders) {
	try {
		// Check a few sample chapters to verify KV status
		const sampleChapters = [1, 2, 18, 67, 114]; // Common chapters
		const status = {
			available: 0,
			missing: 0,
			chapters: {}
		};

		for (const chapter of sampleChapters) {
			const kvKey = `chapter:${chapter}`;
			const data = await env.KV_QURAN_DATA.get(kvKey, 'json');
			
			if (data) {
				status.available++;
				status.chapters[chapter] = {
					available: true,
					verseCount: data.verses ? Object.keys(data.verses).length : 0,
					storedAt: data.storedAt
				};
			} else {
				status.missing++;
				status.chapters[chapter] = {
					available: false
				};
			}
		}

		return new Response(JSON.stringify({
			kvStatus: 'healthy',
			namespace: 'KV_QURAN_DATA',
			sampleStatus: status,
			timestamp: new Date().toISOString()
		}), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});

	} catch (error) {
		console.error('KV status check error:', error);
		return new Response(JSON.stringify({
			kvStatus: 'error',
			error: error.message,
			timestamp: new Date().toISOString()
		}), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
}

/**
 * Handle proxy requests (original functionality)
 */
async function handleProxyRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const targetUrl = decodeURIComponent(url.pathname.substring(7)); // Remove '/proxy/'

	if (!targetUrl || !targetUrl.startsWith('http')) {
		return new Response(JSON.stringify({
			error: 'Invalid URL',
			message: 'Target URL must be provided and start with http'
		}), {
			status: 400,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}

	try {
		console.log(`Proxying request to: ${targetUrl}`);

		const response = await fetch(targetUrl, {
			method: request.method,
			headers: {
				'User-Agent': 'Quran-WordByWord-Proxy/1.0',
				'Accept': 'application/json',
			},
		});

		const data = await response.text();
		
		return new Response(data, {
			status: response.status,
			headers: {
				...corsHeaders,
				'Content-Type': response.headers.get('Content-Type') || 'application/json',
			}
		});

	} catch (error) {
		console.error('Proxy error:', error);
		return new Response(JSON.stringify({
			error: 'Proxy request failed',
			message: error.message,
		}), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
}

/**
 * Handle raw KV access requests
 */
async function handleKVRawRequest(request, env, corsHeaders) {
	const url = new URL(request.url);
	const key = url.pathname.replace('/kv/raw/', '');

	if (!key) {
		return new Response(JSON.stringify({
			error: 'Key required',
			message: 'Please provide a key to retrieve'
		}), {
			status: 400,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}

	try {
		console.log(`Raw KV access for key: ${key}`);
		const value = await env.KV_QURAN_DATA.get(key);
		
		if (value !== null) {
			return new Response(value, {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		} else {
			return new Response('null', {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
			});
		}
	} catch (error) {
		console.error('Raw KV error:', error);
		return new Response(JSON.stringify({
			error: 'KV access failed',
			message: error.message
		}), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
}

/**
 * Handle debug requests
 */
async function handleDebugRequest(request, env, corsHeaders) {
	try {
		// Test KV access with different keys
		const testKeys = ['chapter:1', 'chapter-1', '1', 'test'];
		const kvTests = {};
		
		console.log('DEBUG: Environment object keys:', Object.keys(env));
		console.log('DEBUG: KV_QURAN_DATA available:', !!env.KV_QURAN_DATA);
		
		for (const key of testKeys) {
			try {
				console.log(`DEBUG: Testing key "${key}"`);
				const value = await env.KV_QURAN_DATA.get(key);
				console.log(`DEBUG: Key "${key}" result:`, value !== null ? 'EXISTS' : 'NOT_FOUND');
				kvTests[key] = value !== null ? 'EXISTS' : 'NOT_FOUND';
			} catch (error) {
				console.log(`DEBUG: Key "${key}" error:`, error.message);
				kvTests[key] = `ERROR: ${error.message}`;
			}
		}

		const debugInfo = {
			timestamp: new Date().toISOString(),
			environment: {
				kvNamespace: env.KV_QURAN_DATA ? 'BOUND' : 'NOT_BOUND',
				workerVersion: 'enhanced-kv-v2'
			},
			kvTests,
			requestInfo: {
				url: request.url,
				method: request.method,
				headers: Object.fromEntries(request.headers.entries())
			}
		};

		return new Response(JSON.stringify(debugInfo, null, 2), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Debug error:', error);
		return new Response(JSON.stringify({
			error: 'Debug failed',
			message: error.message,
			timestamp: new Date().toISOString()
		}), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
}
