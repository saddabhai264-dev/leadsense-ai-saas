import type { Campaign, CampaignLead, CampaignStep, EmailEvent, Lead, SenderAccount, Subscription } from "@/lib/types";

type AnyRecord = Record<string, any>;

export function toLead(lead: AnyRecord): Lead {
  return {
    id: lead.id,
    user_id: lead.userId,
    first_name: lead.firstName,
    last_name: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    job_title: lead.jobTitle,
    company_name: lead.companyName,
    company_domain: lead.companyDomain,
    company_size: lead.companySize,
    industry: lead.industry,
    location: lead.location,
    linkedin_url: lead.linkedinUrl,
    status: lead.status,
    score: lead.score,
    score_reason: lead.scoreReason,
    email_status: lead.emailStatus,
    email_confidence: lead.emailConfidence,
    email_verification_reason: lead.emailVerificationReason,
    email_verified_at: lead.emailVerifiedAt?.toISOString?.() ?? lead.emailVerifiedAt ?? null,
    source: lead.source,
    notes: lead.notes,
    last_contacted_at: lead.lastContactedAt?.toISOString?.() ?? lead.lastContactedAt ?? null,
    created_at: lead.createdAt?.toISOString?.() ?? lead.createdAt,
    updated_at: lead.updatedAt?.toISOString?.() ?? lead.updatedAt,
  };
}

export function toCampaign(campaign: AnyRecord): Campaign {
  return {
    id: campaign.id,
    user_id: campaign.userId,
    name: campaign.name,
    audience: campaign.audience,
    offer: campaign.offer,
    goal: campaign.goal,
    status: campaign.status,
    total_leads: campaign.totalLeads,
    reply_rate: campaign.replyRate,
    created_at: campaign.createdAt?.toISOString?.() ?? campaign.createdAt,
    updated_at: campaign.updatedAt?.toISOString?.() ?? campaign.updatedAt,
    campaign_steps: campaign.steps?.map(toCampaignStep) ?? campaign.campaign_steps,
    campaign_leads: campaign.campaignLeads?.map(toCampaignLead) ?? campaign.campaign_leads,
  };
}

export function toCampaignStep(step: AnyRecord): CampaignStep {
  return {
    id: step.id,
    campaign_id: step.campaignId,
    step_order: step.stepOrder,
    delay_days: step.delayDays,
    subject: step.subject,
    body: step.body,
    created_at: step.createdAt?.toISOString?.() ?? step.createdAt,
  };
}

export function toCampaignLead(item: AnyRecord): CampaignLead {
  return {
    id: item.id,
    campaign_id: item.campaignId,
    lead_id: item.leadId,
    status: item.status,
    current_step: item.currentStep,
    sent_at: item.sentAt?.toISOString?.() ?? item.sentAt ?? null,
    replied_at: item.repliedAt?.toISOString?.() ?? item.repliedAt ?? null,
    bounced_at: item.bouncedAt?.toISOString?.() ?? item.bouncedAt ?? null,
    added_at: item.addedAt?.toISOString?.() ?? item.addedAt,
    lead: item.lead ? toLead(item.lead) : undefined,
  };
}

export function toSenderAccount(account: AnyRecord): SenderAccount {
  return {
    id: account.id,
    user_id: account.userId,
    provider: account.provider,
    from_name: account.fromName,
    from_email: account.fromEmail,
    reply_to: account.replyTo,
    smtp_host: account.smtpHost,
    smtp_port: account.smtpPort,
    smtp_username: account.smtpUsername,
    smtp_password_encrypted: account.smtpPasswordEncrypted,
    daily_limit: account.dailyLimit,
    status: account.status,
    last_tested_at: account.lastTestedAt?.toISOString?.() ?? account.lastTestedAt ?? null,
    created_at: account.createdAt?.toISOString?.() ?? account.createdAt,
    updated_at: account.updatedAt?.toISOString?.() ?? account.updatedAt,
  };
}
