# Instructions for Creating Cloudflare KV Bindings

## Option 1: Dashboard Method (Easiest)

1. Go to https://dash.cloudflare.com/
2. Navigate to "Workers & Pages" > "KV"
3. Click "Create namespace"
4. Create these namespaces:
   - quran-api-cache-prod
   - quran-api-cache-dev  
   - quran-api-cache-preview

5. Copy each namespace ID and update wrangler.toml

## Option 2: Command Line Method

1. Get your API token from: https://dash.cloudflare.com/profile/api-tokens
2. Create token with permissions:
   - Zone:Zone Settings:Read
   - Zone:Zone:Read
   - User:User Details:Read
   - Account:Cloudflare Workers:Edit

3. Set environment variable:
   ```cmd
   set CLOUDFLARE_API_TOKEN=your_token_here
   ```

4. Run commands:
   ```cmd
   wrangler kv:namespace create "CACHE_KV"
   wrangler kv:namespace create "CACHE_KV" --preview
   ```

## Option 3: Use existing simple worker (Current recommendation)

Since your current public CORS proxy is working well, you can:
1. Keep using the public proxy for now
2. Implement KV caching later when you need better performance
3. Start with the simple worker and add bindings gradually

## Quick Setup Commands:

After getting namespace IDs, replace in wrangler.toml:
- PUT_YOUR_PRODUCTION_KV_ID_HERE → actual production namespace ID
- PUT_YOUR_PREVIEW_KV_ID_HERE → actual preview namespace ID  
- PUT_YOUR_DEVELOPMENT_KV_ID_HERE → actual development namespace ID
- PUT_YOUR_DEV_PREVIEW_KV_ID_HERE → actual dev preview namespace ID

Then deploy:
```cmd
wrangler publish --env production
```
