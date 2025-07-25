// Enhanced Cloudflare Worker with bindings for QuranWBW API proxy
// Deploy this to Cloudflare Workers with KV storage binding

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx)
  }
}

async function handleRequest(request, env, ctx) {
  const url = new URL(request.url)
  
  // Use environment variables for configuration
  const allowedHosts = [
    'api.quranwbw.com',
    'static.quranwbw.com', 
    'audios.quranwbw.com',
    'everyayah.com'
  ]
  
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['*']
  const cacheTrail = parseInt(env.CACHE_TTL) || 3600
  
  // Debug logging
  console.log('Request URL:', request.url)
  console.log('Origin:', request.headers.get('Origin'))
  console.log('Allowed Origins:', allowedOrigins)
  
  // Extract target URL from the path
  const pathParts = url.pathname.slice(1).split('/')
  const targetHost = pathParts[0]
  
  // Debug logging
  console.log('Path parts:', pathParts)
  console.log('Target host:', targetHost)
  
  // Handle root path requests (for testing)
  if (!targetHost || targetHost === '') {
    return new Response(JSON.stringify({
      status: 'OK',
      message: 'Enhanced Cloudflare Worker with KV caching is running',
      timestamp: new Date().toISOString(),
      allowedHosts: allowedHosts,
      version: '2.0'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request, allowedOrigins)
      }
    })
  }
  
  if (!allowedHosts.includes(targetHost)) {
    return new Response(JSON.stringify({
      error: 'Forbidden: Invalid target host',
      requestedHost: targetHost,
      allowedHosts: allowedHosts,
      path: url.pathname
    }), { 
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request, allowedOrigins)
      }
    })
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        ...getCorsHeaders(request, allowedOrigins),
        'Access-Control-Max-Age': '86400'
      }
    })
  }
  
  // Construct target URL
  const targetPath = pathParts.slice(1).join('/')
  const targetUrl = `https://${targetHost}/${targetPath}${url.search}`
  
  // Try to get from cache first (if KV binding available)
  if (env.CACHE_KV && request.method === 'GET') {
    const cacheKey = `proxy:${targetUrl}`
    const cached = await env.CACHE_KV.get(cacheKey, 'json')
    
    if (cached) {
      console.log('Cache hit for:', targetUrl)
      return new Response(JSON.stringify(cached.data), {
        status: cached.status,
        headers: {
          ...cached.headers,
          ...getCorsHeaders(request, allowedOrigins),
          'X-Cache': 'HIT'
        }
      })
    }
  }
  
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
    
    // Get response data for caching
    const responseData = await response.text()
    let parsedData
    try {
      parsedData = JSON.parse(responseData)
    } catch {
      parsedData = responseData
    }
    
    // Cache successful responses (if KV binding available)
    if (env.CACHE_KV && request.method === 'GET' && response.ok) {
      const cacheKey = `proxy:${targetUrl}`
      const cacheData = {
        data: parsedData,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: Date.now()
      }
      
      // Cache with TTL
      ctx.waitUntil(
        env.CACHE_KV.put(cacheKey, JSON.stringify(cacheData), {
          expirationTtl: cacheTrail
        })
      )
    }
    
    // Create response with CORS headers
    const modifiedResponse = new Response(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        ...getCorsHeaders(request, allowedOrigins),
        'Cache-Control': `public, max-age=${cacheTrail}`,
        'X-Cache': 'MISS'
      }
    })
    
    return modifiedResponse
    
  } catch (error) {
    console.error('Proxy error:', error)
    
    return new Response(JSON.stringify({ 
      error: 'Proxy error', 
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(request, allowedOrigins)
      }
    })
  }
}

// Helper function to get CORS headers
function getCorsHeaders(request, allowedOrigins) {
  const origin = request.headers.get('Origin')
  
  // Handle local file testing (origin is null)
  if (!origin || origin === 'null') {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'false'
    }
  }
  
  // Check if origin is allowed
  const isOriginAllowed = allowedOrigins.includes('*') || 
                         allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '')))
  
  const allowedOrigin = isOriginAllowed ? origin : '*'
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'false'
  }
}
