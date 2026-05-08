# Bayblaze Frontend Deployment

This storefront is a Next.js app. The simplest production path is Vercel for
the frontend and a separate public Medusa backend later.

## Frontend First

1. Create a GitHub repository for this project and push the code.
2. Import the repository into Vercel as a Next.js project.
3. Add these Vercel environment variables:

```env
NEXT_PUBLIC_SITE_URL=https://bayblaze.net
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.bayblaze.net
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_publishable_key_here
NEXT_PUBLIC_MEDUSA_REGION_ID=
```

If Medusa is not public yet, the storefront will still deploy. Product carousels
will show a simple placeholder until `NEXT_PUBLIC_MEDUSA_BACKEND_URL` points to
the hosted Medusa API.

## Domain

After Vercel creates the deployment:

1. Add `bayblaze.net` and `www.bayblaze.net` in the Vercel project Domains tab.
2. In Cloudflare DNS, point the domain records to the values Vercel gives you.
3. Keep Cloudflare proxying enabled only if Vercel confirms the DNS is valid.

## Current DNS Note

`bayblaze.net` currently resolves through Cloudflare. Repointing it will replace
the existing live site, so do that only when the new storefront is ready.
