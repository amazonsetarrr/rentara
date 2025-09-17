# Loki/Grafana Logging Setup Guide

This guide explains how to set up centralized logging with Loki and Grafana for your Rentara tenant management app deployed on Vercel.

## Overview

The application now supports shipping logs to Grafana Loki for centralized monitoring and analysis. This eliminates the need to check web console logs or debugging back-and-forth with Claude Code.

## Features

- ✅ **Client-side log shipping** - All browser logs sent to Loki
- ✅ **Automatic batching** - Reduces API calls with intelligent buffering
- ✅ **Retry logic** - Handles network failures with exponential backoff
- ✅ **Real-time monitoring** - Live log streaming to Grafana dashboards
- ✅ **Error correlation** - Links user sessions with error events
- ✅ **Environment isolation** - Separate logging for dev/staging/prod

## Quick Start

### 1. Set up Grafana Cloud (Recommended)

1. Create a free account at [Grafana Cloud](https://grafana.com/products/cloud/)
2. Navigate to **Loki** in your Grafana Cloud stack
3. Get your Loki endpoint: `https://logs-prod-us-central1.grafana.net`
4. Generate API credentials:
   - Username: Your Grafana user ID (usually a number)
   - Password: Create an API key with `MetricsPublisher` role

### 2. Configure Environment Variables

Update your `.env` file (use `.env.example` as reference):

```bash
# Enable Loki logging
VITE_LOKI_ENABLED=true

# Loki endpoint from Grafana Cloud
VITE_LOKI_ENDPOINT=https://logs-prod-us-central1.grafana.net

# Authentication credentials
VITE_LOKI_USERNAME=your_user_id
VITE_LOKI_PASSWORD=your_api_key

# Optional: Custom tenant identifier
VITE_LOKI_TENANT=rentara-prod
```

### 3. Deploy to Vercel

Set the same environment variables in your Vercel project:

```bash
# Using Vercel CLI
vercel env add VITE_LOKI_ENABLED
# Enter: true

vercel env add VITE_LOKI_ENDPOINT
# Enter: https://logs-prod-us-central1.grafana.net

vercel env add VITE_LOKI_USERNAME
# Enter: your_user_id

vercel env add VITE_LOKI_PASSWORD
# Enter: your_api_key
```

Or set them in the Vercel dashboard under Project Settings > Environment Variables.

### 4. Verify Configuration

1. Deploy your application
2. Open the app and press `Ctrl+Shift+L` to open the Log Monitor
3. Check the **Loki Logging Status** section - should show "🟢 Enabled"
4. Perform some actions in the app (login, create property, etc.)
5. Check your Grafana Explore page to see logs appearing

## Vercel Log Drains (Server-side Logs)

For server-side logs (build logs, function execution), set up Vercel Log Drains:

### 1. Create Log Drain

```bash
# Using Vercel CLI
vercel log-drains add https://your-loki-endpoint.com/loki/api/v1/push \
  --format=json \
  --headers="Authorization=Basic $(echo -n 'username:password' | base64)"
```

### 2. Alternative: Custom Webhook

Create a simple webhook service that receives Vercel logs and forwards to Loki:

```javascript
// webhook-to-loki.js
export default async function handler(req, res) {
  const lokiPayload = {
    streams: [{
      stream: {
        app: 'rentara',
        source: 'vercel',
        level: 'info'
      },
      values: [[
        Date.now() * 1000000, // nanoseconds
        JSON.stringify(req.body)
      ]]
    }]
  }

  await fetch(process.env.LOKI_ENDPOINT + '/loki/api/v1/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(process.env.LOKI_AUTH).toString('base64')}`
    },
    body: JSON.stringify(lokiPayload)
  })

  res.status(200).json({ status: 'ok' })
}
```

## Grafana Dashboard

Import the included dashboard configuration:

### 1. Pre-built Dashboard

Use the `grafana-dashboard.json` configuration file:

1. In Grafana, go to **Dashboards** > **Import**
2. Upload the `grafana-dashboard.json` file
3. Configure data source as your Loki instance

### 2. Key Metrics

The dashboard includes:

- **Error Rate Trends** - Track error frequency over time
- **User Actions** - Monitor user behavior and feature usage
- **Performance Metrics** - API response times and load performance
- **System Status** - Application health and Loki connectivity
- **Session Analysis** - User session flows and error correlation

### 3. Alerting Rules

Set up alerts for:

- Error rate > 5% over 5 minutes
- API response time > 2 seconds
- Loki connectivity issues
- High memory usage patterns

## Log Structure

Logs are structured with consistent labels for easy filtering:

```json
{
  "app": "rentara-tenant-management",
  "version": "2.0.0",
  "environment": "production",
  "level": "error",
  "log_type": "user_action",
  "session_id": "1234567890_abc123",
  "user_id": "user-uuid-here"
}
```

## Common Queries

### Recent Errors
```logql
{app="rentara-tenant-management", level="error"} | json
```

### User Actions
```logql
{app="rentara-tenant-management", log_type="user_action"} | json
```

### API Errors
```logql
{app="rentara-tenant-management", log_type="api_error"} | json
```

### Session Analysis
```logql
{app="rentara-tenant-management", session_id="specific-session"} | json
```

## Development

### Local Testing

For local development, you can:

1. Set `VITE_LOKI_ENABLED=false` to disable logging
2. Use a local Loki instance with Docker:

```bash
# docker-compose.yml for local Loki
version: '3'
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
    command: -config.file=/etc/loki/local-config.yaml
```

### Debug Mode

Use the Log Monitor (Ctrl+Shift+L) to:

- View real-time log buffer status
- Manually flush logs to Loki
- Toggle Loki transport on/off
- Export logs for analysis

## Troubleshooting

### Common Issues

1. **"Endpoint not configured"**
   - Check `VITE_LOKI_ENDPOINT` environment variable
   - Ensure it's set in Vercel deployment

2. **"Authentication failed"**
   - Verify `VITE_LOKI_USERNAME` and `VITE_LOKI_PASSWORD`
   - Check API key permissions in Grafana

3. **"Logs not appearing"**
   - Check network connectivity
   - Verify Loki endpoint URL format
   - Look for CORS issues in browser console

4. **"High API usage"**
   - Logs are batched by default (10 logs or 5 seconds)
   - Adjust `batchSize` and `flushInterval` if needed

### Rate Limits

Grafana Cloud free tier includes:
- 50GB log ingestion per month
- 30-day retention

For higher usage, consider:
- Implementing log sampling for high-traffic routes
- Using different log levels for different environments
- Setting up log rotation policies

## Cost Optimization

1. **Use appropriate log levels**:
   - Production: `error` and `warn` only
   - Staging: `info` and above
   - Development: `debug` and above

2. **Implement sampling**:
   ```javascript
   // Sample 10% of debug logs in production
   if (level === 'debug' && Math.random() > 0.1) return
   ```

3. **Filter noisy logs**:
   - Exclude health checks
   - Skip repetitive user actions
   - Aggregate similar errors

## Security

- Environment variables are only accessible on the client side
- Use dedicated API keys with minimal permissions
- Regularly rotate authentication credentials
- Monitor access logs in Grafana Cloud

## Support

For issues with this logging setup:

1. Check the Log Monitor for transport status
2. Verify environment variable configuration
3. Test with curl to isolate network issues
4. Review Grafana Cloud usage and limits