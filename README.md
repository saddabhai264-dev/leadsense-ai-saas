# LeadSense AI

Production-ready AI lead intelligence and outbound SaaS built with Next.js 15, TypeScript, Tailwind CSS, Prisma, Neon/Postgres, Auth.js, OpenAI, SMTP, and Stripe.

## What is included

- Email/password authentication
- Optional Google OAuth
- Neon/Postgres database with Prisma
- Responsive dashboard with real lead statistics
- Lead search, filtering, CSV import, CSV export
- AI lead scoring
- Website analyzer
- AI cold email generator
- CRM pipeline: New, Contacted, Interested, Closed
- Campaign builder and lead assignment
- SMTP sender accounts
- Batch campaign sending queue
- Campaign analytics and reply/bounce tracking
- Stripe subscription checkout and webhook handling
- Production health check at `/api/health`

## Local setup

```bash
npm install
copy .env.example .env.local
npm run db:generate
npm run db:push
npm run dev
```

Open the localhost URL shown in your terminal.

## Required env vars

```env
DATABASE_URL=postgresql://user:password@host.neon.tech/neondb?sslmode=require&channel_binding=require
AUTH_SECRET=strong-random-secret
AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_ENCRYPTION_KEY=different-strong-random-secret
```

Optional feature env vars:

```env
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

Generate strong secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Production deploy

Full deployment guide: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

Short version:

1. Rotate your Neon password if the connection string was ever shared.
2. Push this repo to GitHub.
3. Import it in Vercel.
4. Add all production env vars in Vercel.
5. Run `npm run db:push` against production Neon.
6. Deploy.
7. Open `/api/health` on the deployed URL.

## User tutorial

Full user guide: [docs/USER_GUIDE.md](./docs/USER_GUIDE.md)

Basic workflow:

1. Sign up or log in.
2. Import real leads from CSV in **Dashboard → Lead search**.
3. Score leads with AI.
4. Analyze prospect websites.
5. Generate cold emails.
6. Move leads through the CRM pipeline.
7. Add SMTP sender account.
8. Create campaign and send a small batch.
9. Track replies, bounces, and campaign analytics.
10. Export CSV when needed.

## Permanent storage

- Database records are stored permanently in Neon/Postgres.
- Imported CSV backups and future file uploads can be stored permanently in Cloudflare R2 or Cloudinary.
- If Cloudflare asks for a card, use Cloudinary first.
- Local disk is only used for code, build cache, dependencies, and your local `.env` files.
- R2 setup guide: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## Real data import

UI import:

- Go to **Dashboard → Lead search**
- Upload a real CSV

CLI import:

```bash
npm run seed:leads -- --user owner@company.com --file ./real-leads.csv
```

CSV template: [docs/real-leads-template.csv](./docs/real-leads-template.csv)

## API routes

| Route | Purpose |
| --- | --- |
| `/api/health` | Production health check |
| `/api/auth/[...nextauth]` | Auth.js session/OAuth handlers |
| `/api/auth/register` | Email/password registration |
| `/api/leads` | Search/list and create leads |
| `/api/leads/[id]` | Update or delete leads |
| `/api/leads/import` | CSV import |
| `/api/leads/verify` | Email verification |
| `/api/export` | CSV export |
| `/api/ai/score` | AI lead scoring |
| `/api/ai/analyze` | Website analyzer |
| `/api/ai/email` | Cold email generator |
| `/api/campaigns` | Campaign list/create |
| `/api/campaigns/[id]/leads` | Assign leads |
| `/api/campaigns/[id]/send` | Send queued batch |
| `/api/campaigns/[id]/analytics` | Campaign performance |
| `/api/sender-accounts` | SMTP accounts |
| `/api/billing/checkout` | Stripe checkout |
| `/api/billing/webhook` | Stripe webhook |

## Quality commands

```bash
npm run typecheck
npm run build
```
