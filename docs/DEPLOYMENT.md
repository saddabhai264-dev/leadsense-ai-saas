# LeadSense AI production deployment

## Pre-deploy checklist

- Rotate the Neon database password if the connection string was ever shared.
- Confirm the production Neon database is empty or contains only real customer data.
- Run `npm run typecheck`.
- Run `npm run build`.
- Run `npm run db:push` against the production Neon database.

## Vercel environment variables

Add these in **Vercel → Project → Settings → Environment Variables**.

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&channel_binding=require
AUTH_SECRET=generate-a-strong-secret
AUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
APP_ENCRYPTION_KEY=generate-a-different-strong-32-char-plus-secret

AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=leadsense-files
R2_PUBLIC_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

STRIPE_SECRET_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
```

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Google OAuth

In Google Cloud Console, add:

- Authorized JavaScript origin: `https://your-domain.vercel.app`
- Redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`

Google auth is optional. Email/password auth works without Google keys.

## Permanent file storage without card: Cloudinary

Use Cloudinary if Cloudflare R2 asks for a card. It is the easiest no-card friendly option for starting.

1. Open `https://cloudinary.com/users/register_free`.
2. Sign up with Google/email.
3. Open the dashboard.
4. Copy:
   - Cloud name
   - API key
   - API secret
5. Add them to `.env.local` and Vercel env vars:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

The app will automatically use Cloudinary when these values exist.

## Permanent file storage with Cloudflare R2

Use this only if you can add a billing method. R2 has a generous free monthly allowance, but Cloudflare may require a payment method for verification.

1. Open Cloudflare Dashboard.
2. Go to **R2 Object Storage**.
3. Create a bucket named `leadsense-files`.
4. Go to **Manage R2 API Tokens**.
5. Create an API token with object read/write access for this bucket.
6. Copy:
   - Account ID
   - Access Key ID
   - Secret Access Key
   - Bucket name
7. Add them to Vercel env vars:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=leadsense-files
```

`R2_PUBLIC_URL` is optional. Leave it blank if you want private storage. If you later connect a public/custom domain to the bucket, add that URL.

## Stripe

1. Create a recurring Product + Price.
2. Add the price ID to `STRIPE_PRO_PRICE_ID`.
3. Add webhook endpoint:

```txt
https://your-domain.vercel.app/api/billing/webhook
```

4. Subscribe to checkout/subscription events.
5. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Health check

After deployment, open:

```txt
https://your-domain.vercel.app/api/health
```

Expected healthy response:

```json
{
  "status": "ok",
  "database": "ok"
}
```

If status is `degraded`, the response will list missing env vars. It does not expose secret values.

## Import real leads from CLI

First create/register the owner user in the deployed app or local app connected to production Neon.

Then run:

```bash
npm run seed:leads -- --user owner@company.com --file ./real-leads.csv
```

The CSV must contain real data. Use `docs/real-leads-template.csv` as a blank header template.
