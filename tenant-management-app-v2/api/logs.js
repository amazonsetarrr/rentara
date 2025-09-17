// Vercel serverless function to proxy logs to Grafana Loki
// Solves CORS issues by forwarding browser logs server-side

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get Loki configuration from environment variables
    const lokiEndpoint = process.env.VITE_LOKI_ENDPOINT
    const lokiUsername = process.env.VITE_LOKI_USERNAME
    const lokiPassword = process.env.VITE_LOKI_PASSWORD
    const lokiTenant = process.env.VITE_LOKI_TENANT

    // Validate required configuration
    if (!lokiEndpoint || !lokiUsername || !lokiPassword) {
      console.error('Missing Loki configuration:', {
        hasEndpoint: !!lokiEndpoint,
        hasUsername: !!lokiUsername,
        hasPassword: !!lokiPassword
      })
      return res.status(500).json({
        error: 'Loki configuration incomplete',
        details: 'Missing required environment variables'
      })
    }

    // Validate request body
    if (!req.body || !req.body.streams) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: 'Expected streams array in request body'
      })
    }

    // Prepare headers for Loki request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${lokiUsername}:${lokiPassword}`).toString('base64')}`
    }

    // Add tenant header if configured
    if (lokiTenant) {
      headers['X-Scope-OrgID'] = lokiTenant
    }

    // Add proxy identification headers
    headers['User-Agent'] = 'Rentara-Vercel-Proxy/1.0'
    headers['X-Forwarded-For'] = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'

    // Forward the request to Loki
    const lokiResponse = await fetch(`${lokiEndpoint}/loki/api/v1/push`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body)
    })

    // Check if Loki request was successful
    if (!lokiResponse.ok) {
      const errorText = await lokiResponse.text()
      console.error('Loki request failed:', {
        status: lokiResponse.status,
        statusText: lokiResponse.statusText,
        error: errorText,
        endpoint: lokiEndpoint
      })

      return res.status(502).json({
        error: 'Failed to forward logs to Loki',
        status: lokiResponse.status,
        details: lokiResponse.statusText
      })
    }

    // Success - log for monitoring
    const streamCount = req.body.streams?.length || 0
    const logCount = req.body.streams?.reduce((total, stream) =>
      total + (stream.values?.length || 0), 0) || 0

    console.log(`✅ Successfully forwarded ${logCount} logs in ${streamCount} streams to Loki`)

    // Return success response
    res.status(200).json({
      success: true,
      streamsForwarded: streamCount,
      logsForwarded: logCount,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Proxy error:', error)

    // Determine error type for better client handling
    let errorType = 'unknown'
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorType = 'network'
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorType = 'fetch'
    }

    res.status(500).json({
      error: 'Internal proxy error',
      type: errorType,
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// Add helpful configuration for Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Adjust based on log volume
    },
  },
}