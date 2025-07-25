// Cloudflare Worker to proxy QuranWBW API calls and handle CORS
// Deploy this to Cloudflare Workers at: https://workers.cloudflare.com/

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Only handle specific API endpoints
  const allowedHosts = [
    'api.quranwbw.com',
    'static.quranwbw.com',
    'audios.quranwbw.com',
    'everyayah.com'
  ]
  
  // Extract target URL from the path
  // Expected format: https://your-worker.workers.dev/api.quranwbw.com/v2/chapter?params
  const pathParts = url.pathname.slice(1).split('/')
  const targetHost = pathParts[0]
  
  if (!allowedHosts.includes(targetHost)) {
    return new Response('Forbidden: Invalid target host', { 
      status: 403,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    })
  }
  
  // Construct target URL
  const targetPath = pathParts.slice(1).join('/')
  const targetUrl = `https://${targetHost}/${targetPath}${url.search}`
  
  try {
    // Forward the request to the target API
    const targetRequest = new Request(targetUrl, {
      method: request.method,
      headers: {
        'User-Agent': 'QuranZikirNurani/1.0',
        'Accept': 'application/json',
        ...Object.fromEntries(
          [...request.headers.entries()].filter(([key]) => 
            !['host', 'origin', 'referer'].includes(key.toLowerCase())
          )
        )
      },
      body: request.method !== 'GET' ? request.body : undefined
    })
    
    const response = await fetch(targetRequest)
    
    // Create response with CORS headers
    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    })
    
    return modifiedResponse
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Proxy error', 
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }
}
