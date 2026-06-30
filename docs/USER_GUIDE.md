# LeadSense AI user guide

This guide is for the person using LeadSense after deployment.

## 1. Create your account

Open your deployed app URL and sign up with email/password or Google.

## 2. Import real leads

Go to **Dashboard → Lead search** and upload a CSV.

Required columns:

- `first_name` or `name`
- `company_name` or `company`

Recommended columns:

- `email`
- `job_title`
- `company_domain`
- `industry`
- `location`
- `linkedin_url`
- `status`
- `notes`

Use [real-leads-template.csv](./real-leads-template.csv) as the empty template.

## 3. Score leads with AI

Open a lead and run AI scoring. LeadSense will store the score and reason against the lead.

## 4. Analyze a website

Go to **Website analyzer**, paste a company website, and run analysis. This creates buying signals, pain points, and targeting context.

## 5. Generate cold email

Go to **Cold email generator**, enter the real prospect/company context, then generate and copy the email.

## 6. Move leads through pipeline

Go to **Pipeline** and drag/move leads through:

- New
- Contacted
- Interested
- Closed

## 7. Connect a sender account

Go to **Sending** and add SMTP credentials.

For Gmail/Google Workspace, use an app password or SMTP-compatible credentials.

## 8. Create and send campaigns

Go to **Campaigns**:

1. Create a campaign.
2. Add real leads.
3. Confirm your sender account.
4. Send a small batch first.
5. Watch analytics and replies.

## 9. Export CSV

Use CSV export from the leads area when you need a backup or external CRM sync.
